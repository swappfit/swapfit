// src/services/adminService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import { sendPushNotification } from './notificationService.js';
const prisma = new PrismaClient();

export const getPendingGyms = async () => {
    return await prisma.gym.findMany({
        where: { status: 'pending' },
        include: { manager: { select: { email: true } } } // Include manager email for context
    });
};

export const updateGymStatus = async (gymId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new AppError('Invalid status provided. Must be "approved" or "rejected".', 400);
    }
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!gym) throw new AppError('Gym not found.', 404);

    return await prisma.gym.update({
        where: { id: gymId },
        data: { status },
    });
};

export const updateGymBadges = async (gymId, badges) => {
    if (!Array.isArray(badges)) {
        throw new AppError('Badges must be provided as an array of strings.', 400);
    }
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!gym) throw new AppError('Gym not found.', 404);
    if (gym.status !== 'approved') {
        throw new AppError('Badges can only be added to approved gyms.', 400);
    }

    return await prisma.gym.update({
        where: { id: gymId },
        data: { badges: badges }, // Overwrites the existing array
    });
};
/**
 * @description Fetches platform-wide statistics for the Admin Dashboard.
 */
export const getAdminDashboardStats = async () => {
  // Use a transaction to run all count queries in parallel for max efficiency
  const [
    totalUsers,
    totalTrainers,
    totalGyms,
    pendingGyms,
    activeSubscriptions,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.trainerProfile.count(),
    prisma.gym.count(),
    prisma.gym.count({ where: { status: 'pending' } }),
    prisma.subscription.count({ where: { status: { in: ['active', 'in_trial'] } } }),
  ]);

  // Assemble the data into a clean object
  const stats = {
    userStats: {
      total: totalUsers,
      trainers: totalTrainers,
      gymOwners: await prisma.user.count({ where: { role: 'GYM_OWNER' } }), // Example of a more specific count
      members: await prisma.user.count({ where: { role: 'MEMBER' } }),
    },
    gymStats: {
      total: totalGyms,
      pendingApproval: pendingGyms,
      approved: await prisma.gym.count({ where: { status: 'approved' } }),
    },
    platformStats: {
      activeSubscriptions: activeSubscriptions,
      // Placeholder for future revenue tracking
      totalRevenue: 0, 
    },
  };

  return stats;
};

/**
 * @description Admin users listing with pagination and optional role filter
 */
export const getUsers = async ({ page = 1, limit = 20, role }) => {
  const skip = (page - 1) * limit;
  const where = role ? { role } : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        memberProfile: true,
        trainerProfile: true,
        multiGymProfile: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// Temporary schedules source (since schema has no Schedule model yet)
export const getSchedules = async () => {
  // Return most recent schedules across gyms (admin view)
  const schedules = await prisma.schedule.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { gym: { select: { id: true, name: true } } },
  });
  return schedules;
};
/**
 * @description Creates a notification for ALL users and triggers a push notification.
 * This is a powerful, admin-only function for platform-wide announcements.
 * @param {object} notificationData - The notification payload ({ title, message }).
 * @returns {number} The count of users the notification was sent to.
 */
export const sendBroadcastNotification = async (notificationData) => {
  // 1. Fetch the IDs of all users on the platform
  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  if (allUsers.length === 0) {
    throw new AppError('No users found on the platform to notify.', 404);
  }

  const allUserIds = allUsers.map(user => user.id);

  // 2. Prepare the notification records for the database (for the in-app inbox)
  const notificationsToCreate = allUserIds.map(userId => ({
    recipientId: userId,
    title: notificationData.title,
    message: notificationData.message,
    // We don't link it to a specific gym or trainer, as it's a system message.
  }));

  // 3. Use a transaction to ensure both DB inserts and push notifications are handled
  await prisma.$transaction(async (tx) => {
    // a. Save all notification records to the database efficiently
    await tx.notification.createMany({
      data: notificationsToCreate,
    });

    // b. Trigger the push notification to all users
    await sendPushNotification(
      allUserIds,
      {
        title: notificationData.title,
        body: notificationData.message,
      },
      { type: 'platform_announcement' } // Optional data payload
    );
  });

  // 4. Return the count of affected users
  return allUserIds.length;
};
