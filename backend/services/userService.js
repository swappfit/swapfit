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
 * @description Fetches the full user object including their role-specific profile and active subscriptions.
 */
export const getUserProfile = async (userId) => {
  console.log(`[UserService] Attempting to fetch full profile for User ID: ${userId}`);
  if (!userId) {
    throw new AppError("User not identified.", 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
          memberProfile: true,
          trainerProfile: true,
          managedGyms: { take: 1 }, // Assuming a user manages at most one gym
          merchantProfile: true,
          // ✅ THIS IS THE CRITICAL ADDITION
          subscriptions: {
            where: {
              status: 'active' // Only fetch their active subscriptions
            },
            // Optionally include plan details if needed on the profile screen
            include: {
              gymPlan: { select: { id: true, name: true } },
              trainerPlan: { select: { id: true, name: true } }
            }
          },
      },
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }
    
    console.log(`[UserService] Successfully fetched full profile for User ID: ${userId}`);
    // Exclude password before sending back to client
    const { password, ...userResponse } = user;
    return userResponse;

  } catch (error) {
    console.error(`[UserService] FATAL ERROR during profile fetch:`, error);
    throw new AppError('Failed to retrieve user profile due to a server error.', 500);
  }
};