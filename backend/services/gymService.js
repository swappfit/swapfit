// src/services/gymService.js
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

// src/services/gymService.js

export const checkIn = async (userId, gymId) => {
<<<<<<< HEAD
    // 1. Check if the user is already checked into THIS specific gym.
    const existingCheckIn = await prisma.checkIn.findFirst({ 
        where: { userId, gymId, checkOut: null } 
    });
    if (existingCheckIn) {
        throw new AppError('You are already checked in to this gym.', 400);
    }

    // 2. Check for a valid subscription. It can be EITHER a gym-specific plan OR a multi-gym pass.

    // Check for a gym-specific subscription
    const gymSubscription = await prisma.subscription.findFirst({
        where: { userId, status: 'active', gymPlan: { gymId } },
    });

    // Check for a multi-gym pass. We need to find the gym's tier first.
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { badges: true } });
    
    let multiGymSubscription = null;
    if (gym?.badges && gym.badges.length > 0) {
        // Find if the user has an active subscription for any of the gym's tier names
        multiGymSubscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'active',
                multiGymTier: {
                    name: { in: gym.badges } // Check if the tier name is in the gym's badges array
                }
            },
            include: { multiGymTier: { select: { name: true } } }
        });
    }

    // 3. Grant access if either subscription is valid
    if (!gymSubscription && !multiGymSubscription) {
        throw new AppError('No active subscription found for this gym.', 403);
    }

    // 4. If we reach here, the user is authorized. Create the check-in record.
    const newCheckIn = await prisma.checkIn.create({ data: { userId, gymId } });
    
    console.log(`[GymService] User ${userId} checked into gym ${gymId} with pass: ${gymSubscription ? 'Gym Plan' : multiGymSubscription.multiGymTier.name}`);
    return newCheckIn;
=======
    console.log(`[GymService] Starting check-in process for user ${userId} at gym ${gymId}`);
    try {
        // Check if user has an active subscription for this gym
        const activeSubscription = await prisma.subscription.findFirst({
            where: { 
                userId, 
                status: 'active',
                gymPlan: { gymId }
            },
        });
        
        if (!activeSubscription) {
            console.log(`[GymService] Check-in failed: No active subscription for user ${userId} at gym ${gymId}`);
            throw new AppError('No active subscription found for this gym.', 403);
        }

        // Check if user is already checked in somewhere
        const existingCheckIn = await prisma.checkIn.findFirst({ 
            where: { 
                userId, 
                checkOut: null 
            } 
        });
        
        if (existingCheckIn) {
            console.log(`[GymService] Check-in failed: User ${userId} is already checked in.`);
            throw new AppError('You are already checked in.', 400);
        }

        // Create new check-in record with explicit timestamp
        const now = new Date();
        console.log(`[GymService] Creating check-in record at ${now.toISOString()}`);
        
        const newCheckIn = await prisma.checkIn.create({ 
            data: { 
                userId, 
                gymId,
                checkIn: now // ✅ FIX: Explicitly set the check-in time
            } 
        });
        
        console.log(`[GymService] Check-in successful. Record ID: ${newCheckIn.id}, Time: ${newCheckIn.checkIn}`);
        return newCheckIn;
    } catch (error) {
        console.error(`[GymService] Error during check-in for user ${userId}:`, error);
        throw error; // Re-throw the error to be handled by the controller
    }
>>>>>>> 3f4ceb8 (cartcheckoutpending)
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