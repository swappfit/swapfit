// src/services/userService.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

/**
 * Changes the password for a logged-in user.
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new AppError('Password change is not available for this account.', 403);
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('The current password you entered is incorrect.', 401);
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

/**
 * Updates the profile associated with the logged-in user based on their role.
 */
export const updateUserProfile = async (user, updateData) => {
  const { id: userId, role } = user;
  switch (role) {
    case 'MEMBER':
      return await prisma.memberProfile.update({ where: { userId }, data: updateData });
    case 'TRAINER':
      return await prisma.trainerProfile.update({ where: { userId }, data: updateData });
    case 'GYM_OWNER':
      const gym = await prisma.gym.findFirst({ where: { managerId: userId } });
      if (!gym) throw new AppError('No managed gym found for this user.', 404);
      return await prisma.gym.update({ where: { id: gym.id }, data: updateData });
    default:
      throw new AppError('No updatable profile for this user role.', 400);
  }
};



/**
 * @description Fetches the full user object, including their role-specific profile,
 * active subscriptions, and available multi-gym tiers for purchase.
 */
export const getUserProfile = async (userId) => {
  console.log(`[UserService] Attempting to fetch full profile for User ID: ${userId}`);
  if (!userId) throw new AppError("User not identified.", 401);
  try {
    // Use a transaction to fetch user data and available tiers in parallel
    const [user, availableTiers] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
            memberProfile: true,
            trainerProfile: true,
            managedGyms: { take: 1 },
            merchantProfile: true,
            subscriptions: {
              where: { status: 'active' },
              include: {
                gymPlan: { select: { id: true, name: true, gym: { select: { id: true, name: true } } } },
                trainerPlan: { select: { id: true, name: true } },
                multiGymTier: { select: { id: true, name: true, price: true } } // <-- Include tier details
              }
            },
        },
      }),
      // Fetch all available multi-gym tiers that can be purchased
      prisma.multiGymTier.findMany({
        where: { chargebeePlanId: { not: null } }, // Only show tiers that are actually set up for payment
        orderBy: { price: 'asc' }
      })
    ]);

    if (!user) {
      throw new AppError("User not found.", 404);
    }
    
    console.log(`[UserService] Successfully fetched full profile for User ID: ${userId}`);
    
    // Exclude password before sending back to client
    const { password, ...userResponse } = user;

    // Add the available tiers to the response object
    const profileWithTiers = {
        ...userResponse,
        availableMultiGymTiers: availableTiers
    };

    return profileWithTiers;

  } catch (error) {
    console.error(`[UserService] FATAL ERROR during profile fetch:`, error);
    throw new AppError('Failed to retrieve user profile due to a server error.', 500);
  }
};

/**
 * @description Fetches all of the user's check-ins (active and completed), including gym details.
 */
export const getUserCheckIns = async (userId) => {
  try {
    console.log(`[UserService] Fetching ALL check-ins for user ${userId}`);
    
    // ✅ CHANGE: Removed the date filter to fetch all check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId, // Only filter by user ID
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        checkIn: 'desc' // Order by most recent check-in first
      }
    });

    // ✅ IMPORTANT: Ensure dates are properly serialized as ISO strings
    const serializedCheckIns = checkIns.map(checkIn => ({
      ...checkIn,
      checkIn: checkIn.checkIn.toISOString(),
      checkOut: checkIn.checkOut ? checkIn.checkOut.toISOString() : null
    }));

    console.log(`[UserService] Found a total of ${serializedCheckIns.length} check-ins for user ${userId}.`);
    serializedCheckIns.forEach(checkIn => {
        console.log(`[UserService] - CheckIn ID: ${checkIn.id}, Gym: ${checkIn.gym.name}, CheckIn: ${checkIn.checkIn}, CheckOut: ${checkIn.checkOut || 'Still active'}`);
    });

    return serializedCheckIns;
  } catch (error) {
    console.error(`[UserService] Error fetching user check-ins:`, error);
    throw new AppError('Failed to retrieve check-ins due to a server error.', 500);
  }
};

/**
 * @description Placeholder for fetching user statistics.
 */
export const getUserStats = async (userId) => {
    return { totalCheckIns: 0, favoriteGym: null, monthlyWorkouts: 0 };
};