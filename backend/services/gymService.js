import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// A helper function to verify ownership, keeping services DRY
const verifyOwnership = async (gymId, ownerId) => {
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) throw new AppError('Gym not found.', 404);
  if (gym.managerId !== ownerId) throw new AppError('Forbidden: You do not own this gym.', 403);
  return gym;
};

export const getAll = async (queryParams) => {
  let lat = queryParams.lat;
  let lon = queryParams.lon;
  let radius = queryParams.radius !== undefined ? parseFloat(queryParams.radius) : 10;
  radius = isNaN(radius) || radius <= 0 ? 10 : radius;

  if (lat && lon) {
    try {
      const gyms = await prisma.$queryRaw`
        SELECT *, (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lon})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) AS distance
        FROM \`Gym\`
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        HAVING distance < ${radius}
        ORDER BY distance;
      `;
      return { gyms, total: gyms.length };
    } catch (err) {
      console.error('[GymService:getAll] Error in location-based query:', err);
      return { gyms: [], total: 0, error: 'Query error' };
    }
  }

  try {
    const gyms = await prisma.gym.findMany({ orderBy: { name: 'asc' } });
    return { gyms, total: gyms.length };
  } catch (err) {
    console.error('[GymService:getAll] Error in fetching all gyms:', err);
    return { gyms: [], total: 0, error: 'Query error' };
  }
};

export const getById = async (id) => {
  const gym = await prisma.gym.findUnique({
    where: { id },
    include: { plans: { orderBy: { price: 'asc' } } },
  });
  if (!gym) throw new AppError('Gym not found.', 404);
  return gym;
};

export const update = async (gymId, ownerId, updateData) => {
  await verifyOwnership(gymId, ownerId);
  return await prisma.gym.update({ where: { id: gymId }, data: updateData });
};

export const checkIn = async (userId, gymId) => {
    console.log(`[GymService] Starting check-in process for user ${userId} at gym ${gymId}`);
    
    // 1. Check if the user is already checked into THIS specific gym.
    const existingCheckIn = await prisma.checkIn.findFirst({ 
        where: { userId, gymId, checkOut: null, status: { in: ['pending', 'verified'] } } 
    });
    if (existingCheckIn) {
        console.log(`[GymService] User ${userId} is already checked in to gym ${gymId}`);
        throw new AppError('You are already checked in to this gym.', 400);
    }

    // 2. Check for a valid subscription (either gym-specific OR multi-gym)
    const gymSubscription = await prisma.subscription.findFirst({
        where: { 
            userId, 
            status: 'active', 
            gymPlan: { gymId } 
        },
        include: {
            gymPlan: {
                select: { id: true, name: true }
            }
        }
    });

    // 3. Check for multi-gym subscription
    let multiGymSubscription = null;
    
    // Get all active multi-gym subscriptions for the user
    const allMultiGymSubscriptions = await prisma.subscription.findMany({
        where: {
            userId,
            status: 'active',
            multiGymTierId: { not: null }
        },
        include: {
            multiGymTier: {
                select: { id: true, name: true }
            }
        }
    });
    
    console.log(`[GymService] Found ${allMultiGymSubscriptions.length} active multi-gym subscriptions for user ${userId}`);
    
    // If user has any active multi-gym subscription, they can check in to any gym that accepts multi-gym
    if (allMultiGymSubscriptions.length > 0) {
        // Check if the gym accepts multi-gym
        const gym = await prisma.gym.findUnique({ 
            where: { id: gymId }, 
            select: { acceptsMultigym: true, badges: true, name: true } 
        });
        
        console.log(`[GymService] Gym ${gymId} accepts multi-gym: ${gym?.acceptsMultigym}`);
        
        if (gym && gym.acceptsMultigym) {
            multiGymSubscription = allMultiGymSubscriptions[0]; // Use the first active multi-gym subscription
            console.log(`[GymService] User ${userId} can check in to gym ${gymId} using multi-gym subscription`);
        } else {
            console.log(`[GymService] Gym ${gymId} does not accept multi-gym access`);
        }
    }

    // 4. Grant access if either subscription is valid
    if (!gymSubscription && !multiGymSubscription) {
        console.log(`[GymService] No valid subscription found for user ${userId} at gym ${gymId}`);
        
        // Provide more detailed error message
        if (allMultiGymSubscriptions.length === 0) {
            throw new AppError('No active subscription found. Please subscribe to a gym plan or multi-gym pass to check in.', 403);
        } else {
            throw new AppError('This gym does not accept multi-gym access. Please choose a different gym or subscribe to this gym directly.', 403);
        }
    }

    // 5. Create a PENDING check-in record for ALL users
    const newCheckIn = await prisma.checkIn.create({ 
        data: { 
            userId, 
            gymId,
            status: 'pending' // <-- KEY CHANGE: Always create as pending
        } 
    });

    // 6. Emit a real-time event to the gym's staff room
    const { io } = await import('../app.js');
    io.to(`gym_${gymId}`).emit('newPendingCheckIn', {
        checkInId: newCheckIn.id,
        userId: newCheckIn.userId,
        gymId: newCheckIn.gymId,
        checkInTime: newCheckIn.checkIn,
        // You can include user details here if needed for the gym's UI
    });

    const passType = gymSubscription ? 'Gym Plan' : multiGymSubscription.multiGymTier.name;
    console.log(`[GymService] User ${userId} requested check-in to gym ${gymId} with pass: ${passType}. Status: pending.`);
    
    return newCheckIn;
};

export const checkOut = async (userId, checkInId) => {
    console.log(`[GymService] Starting check-out process for user ${userId}, check-in ID ${checkInId}`);
    try {
        // Find the active check-in record
        const checkInRecord = await prisma.checkIn.findFirst({
            where: { 
                id: checkInId, 
                userId, 
                checkOut: null 
            },
        });
        
        if (!checkInRecord) {
            console.log(`[GymService] Check-out failed: Active check-in record not found for ID ${checkInId}.`);
            throw new AppError('Active check-in record not found.', 404);
        }

        // Update the check-in record with checkout time
        const now = new Date();
        console.log(`[GymService] Updating check-out time to ${now.toISOString()}`);
        
        const updatedCheckIn = await prisma.checkIn.update({ 
            where: { id: checkInId }, 
            data: { 
                checkOut: now 
            } 
        });
        
        console.log(`[GymService] Check-out successful for record ID: ${updatedCheckIn.id}`);
        return updatedCheckIn;
    } catch (error) {
        console.error(`[GymService] Error during check-out for user ${userId}:`, error);
        throw error;
    }
};

// ... (all other functions like getMembers, assignTrainer, etc. remain the same) ...
export const getMembers = async (gymId, ownerId) => {
    await verifyOwnership(gymId, ownerId);
    return await prisma.subscription.findMany({
        where: { status: 'active', gymPlan: { gymId } },
        include: { user: { select: { id: true, email: true, memberProfile: true } } },
    });
};

export const assignTrainer = async (gymId, ownerId, trainerUserId) => {
    await verifyOwnership(gymId, ownerId);
    const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId: trainerUserId } });
    if (!trainerProfile) throw new AppError('Trainer profile not found.', 404);
    return await prisma.gym.update({
        where: { id: gymId },
        data: { trainers: { connect: { id: trainerProfile.id } } },
    });
};

export const unassignTrainer = async (gymId, ownerId, trainerUserId) => {
    await verifyOwnership(gymId, ownerId);
    const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId: trainerUserId } });
    if (!trainerProfile) throw new AppError('Trainer profile not found.', 404);
    return await prisma.gym.update({
        where: { id: gymId },
        data: { trainers: { disconnect: { id: trainerProfile.id } } },
    });
};

export const getAssignedTrainers = async (gymId) => {
    const gym = await getById(gymId);
    return gym.trainers;
};

export const createPlan = async (gymId, ownerId, planData) => {
    await verifyOwnership(gymId, ownerId);
    return await prisma.gymPlan.create({ data: { ...planData, gymId } });
};

export const updatePlan = async (planId, ownerId, planData) => {
    const plan = await prisma.gymPlan.findUnique({
        where: { id: planId },
        include: { gym: true },
    });
    if (!plan) throw new AppError('Plan not found.', 404);
    if (plan.gym.managerId !== ownerId) throw new AppError('Forbidden: You do not own this plan.', 403);
    return await prisma.gymPlan.update({ where: { id: planId }, data: planData });
};

export const deletePlan = async (planId, ownerId) => {
    const plan = await prisma.gymPlan.findUnique({
        where: { id: planId },
        include: { gym: true },
    });
    if (!plan) throw new AppError('Plan not found.', 404);
    if (plan.gym.managerId !== ownerId) throw new AppError('Forbidden: You do not own this plan.', 403);
    const activeSubs = await prisma.subscription.count({ where: { gymPlanId: planId, status: 'active' } });
    if (activeSubs > 0) throw new AppError(`Cannot delete plan with ${activeSubs} active subscriber(s).`, 400);
    return await prisma.gymPlan.delete({ where: { id: planId } });
};

export const getPlans = async (gymId) => {
    return await prisma.gymPlan.findMany({ where: { gymId }, orderBy: { price: 'asc' } });
};

export const getGymOwnerDashboard = async (ownerId) => {
  const ownedGym = await prisma.gym.findFirst({ where: { managerId: ownerId } });
  if (!ownedGym) return { totalRevenue: 0, totalMembers: 0, todaysCheckIns: 0, upcomingRenewals: 0 };
  const gymId = ownedGym.id;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [totalMembers, aggregateResult, todaysCheckIns] = await prisma.$transaction([
    prisma.subscription.count({ where: { status: 'active', gymPlan: { gymId: gymId } } }),
    prisma.gymPlan.aggregate({ where: { gymId: gymId, subscriptions: { some: { status: 'active' } } }, _sum: { price: true } }),
    prisma.checkIn.count({ where: { gymId: gymId, checkIn: { gte: todayStart } } }),
  ]);
  return { totalRevenue: aggregateResult._sum.price || 0, totalMembers, todaysCheckIns, upcomingRenewals: 0 };
};

export const getMyGym = async (ownerId) => {
    if (!ownerId) throw new AppError("User ID was not provided to the service.", 500);
    const gym = await prisma.gym.findFirst({ where: { managerId: ownerId }, include: { plans: { orderBy: { price: 'asc' } } } });
    if (!gym) throw new AppError('No managed gym found for this account.', 404);
    return gym;
};

export const getMyMembers = async (ownerId) => {
    const gym = await prisma.gym.findUnique({ where: { managerId: ownerId }, select: { id: true } });
    if (!gym) throw new AppError('No managed gym found for this account.', 404);
    return await prisma.subscription.findMany({
        where: { status: 'active', gymPlan: { gymId: gym.id } },
        include: { user: { select: { id: true, email: true, memberProfile: true } }, gymPlan: { select: { name: true } } },
        orderBy: { startDate: 'desc' }
    });
};

export const getGymsByPlanIds = async (planIds) => {
  if (!planIds || planIds.length === 0) return [];
  const gymPlans = await prisma.gymPlan.findMany({ where: { id: { in: planIds } }, include: { gym: true } });
  const uniqueGyms = gymPlans.reduce((acc, plan) => {
    if (plan.gym && !acc.find(gym => gym.id === plan.gym.id)) acc.push(plan.gym);
    return acc;
  }, []);
  return uniqueGyms;
};

// Add these new service functions
export const getPendingCheckIns = async (gymId) => {
    return await prisma.checkIn.findMany({
        where: {
            gymId,
            status: 'pending'
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    memberProfile: {
                        select: { name: true } // Add photo if you have it
                    }
                }
            }
        },
        orderBy: { checkIn: 'desc' }
    });
};

export const updateCheckInStatus = async (checkInId, verifierId, status) => {
    // First, verify the gym staff owns the gym for this check-in
    const checkIn = await prisma.checkIn.findUnique({
        where: { id: checkInId },
        include: { gym: { select: { managerId: true } } }
    });

    if (!checkIn) throw new AppError('Check-in not found.', 404);
    if (checkIn.gym.managerId !== verifierId) {
        throw new AppError('You are not authorized to verify this check-in.', 403);
    }

    // Update the check-in record
    const updatedCheckIn = await prisma.checkIn.update({
        where: { id: checkInId },
        data: {
            status: status,
            verifiedByGymStaffId: verifierId
        }
    });

    // Emit a real-time event back to the user
    const { io } = await import('../app.js');
    io.to(`user_${updatedCheckIn.userId}`).emit('checkInStatusUpdated', {
        checkInId: updatedCheckIn.id,
        status: updatedCheckIn.status,
        gymId: updatedCheckIn.gymId
    });

    return updatedCheckIn;
};