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
  // Explicitly convert query params from strings to numbers with defaults
  let lat = queryParams.lat;
  let lon = queryParams.lon;
  let radius = queryParams.radius !== undefined ? parseFloat(queryParams.radius) : 10;

  // Defensive fallback to valid numbers
  radius = isNaN(radius) || radius <= 0 ? 10 : radius;

  console.log('[GymService:getAll] Request received:', { lat, lon, radius });

  if (lat && lon) {
    try {
      // The LIMIT clause has been removed to fetch all gyms within the radius
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
        HAVING (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lon})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) < ${radius}
        ORDER BY distance;
      `;

      console.log(`[GymService:getAll] Found ${gyms.length} gyms within radius.`);

      // Response simplified to only include gyms and total count
      return {
        gyms,
        total: gyms.length,
      };
    } catch (err) {
      console.error('[GymService:getAll] Error in location-based query:', err);
      return {
        gyms: [],
        total: 0,
        error: 'Query error',
      };
    }
  }

  // Fallback: Fetch all gyms without pagination
  try {
    const gyms = await prisma.gym.findMany({ orderBy: { name: 'asc' } });
    const total = gyms.length;

    console.log(`[GymService:getAll] Found ${gyms.length} gyms in total.`);

    // Response simplified to only include gyms and total count
    return {
      gyms,
      total,
    };
  } catch (err) {
    console.error('[GymService:getAll] Error in fetching all gyms:', err);
    return {
      gyms: [],
      total: 0,
      error: 'Query error',
    };
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
};
export const checkOut = async (userId, checkInId) => {
    const checkInRecord = await prisma.checkIn.findFirst({
        where: { id: checkInId, userId, checkOut: null },
    });
    if (!checkInRecord) throw new AppError('Active check-in record not found.', 404);

    return await prisma.checkIn.update({ where: { id: checkInId }, data: { checkOut: new Date() } });
};



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
    const gym = await getById(gymId); // re-use getById
    return gym.trainers;
};

// --- Plan Management Services ---

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

/**
 * @description Fetches aggregated data for the Gym Owner's dashboard.
 */
export const getGymOwnerDashboard = async (ownerId) => {
  const ownedGym = await prisma.gym.findFirst({ where: { managerId: ownerId } });
  if (!ownedGym) {
    // Return a default empty state if the owner hasn't created a gym yet.
    return { totalRevenue: 0, totalMembers: 0, todaysCheckIns: 0, upcomingRenewals: 0 };
  }

  const gymId = ownedGym.id;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [totalMembers, aggregateResult, todaysCheckIns] = await prisma.$transaction([
    prisma.subscription.count({
      where: { status: 'active', gymPlan: { gymId: gymId } },
    }),
    prisma.gymPlan.aggregate({
        where: { gymId: gymId, subscriptions: { some: { status: 'active' } } },
        _sum: { price: true }
    }),
    prisma.checkIn.count({
      where: { gymId: gymId, checkIn: { gte: todayStart } },
    }),
  ]);

  return {
    totalRevenue: aggregateResult._sum.price || 0,
    totalMembers: totalMembers,
    todaysCheckIns: todaysCheckIns,
    upcomingRenewals: 0, // Placeholder
  };
};

/**
 * @description Fetches the gym profile for the currently logged-in owner.
 */
export const getMyGym = async (ownerId) => {
    // ✅ LOG: Announce that the function has been entered and show the ID we are looking for.
    console.log(`[GymService] Attempting to find gym for manager ID: ${ownerId}`);

    if (!ownerId) {
        // This is a sanity check in case the user object from the token is malformed.
        console.error("[GymService] CRITICAL ERROR: getMyGym was called with a null or undefined ownerId.");
        throw new AppError("User ID was not provided to the service.", 500);
    }

    const gym = await prisma.gym.findFirst({
        where: { managerId: ownerId },
        include: { plans: { orderBy: { price: 'asc' } } }
    });

    // ✅ LOG: The most important check. Did the database query find anything?
    if (!gym) {
        console.log(`[GymService] No gym found for manager ID: ${ownerId}. Throwing 404 error.`);
        throw new AppError('No managed gym found for this account.', 404);
    }
    
    // ✅ LOG: Success! We found the gym.
    console.log(`[GymService] Successfully found gym "${gym.name}" (ID: ${gym.id}) for manager ID: ${ownerId}`);
    console.log("[GymService] Full gym object returned from DB:", JSON.stringify(gym, null, 2)); 
    return gym;
};

/**
 * @description Fetches active members for the gym managed by the logged-in owner.
 */

export const getMyMembers = async (ownerId) => {
    // 1. Find the gym managed by this owner. This is a crucial security check.
    const gym = await prisma.gym.findUnique({
        where: { managerId: ownerId },
        select: { id: true } // We only need the ID
    });

    if (!gym) {
        throw new AppError('No managed gym found for this account.', 404);
    }

    // 2. Now, use the found gym.id to get all active subscriptions for that gym.
    return await prisma.subscription.findMany({
        where: { 
            status: 'active', 
            gymPlan: { gymId: gym.id } 
        },
        include: {
            // Include the user's details and their specific member profile
            user: { 
                select: { 
                    id: true, 
                    email: true, 
                    memberProfile: true 
                } 
            },
            // Include the name of the plan they are subscribed to
            gymPlan: { 
                select: { name: true } 
            }
        },
        orderBy: { 
            startDate: 'desc' 
        }
    });
};