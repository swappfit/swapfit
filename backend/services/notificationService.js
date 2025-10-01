// src/services/notificationService.js
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export const saveUserFcmToken = async (userId, token) => {
    console.log(`[Service] Upserting FCM token for user: ${userId}`);
    await prisma.fcmToken.upsert({
        where: { token },
        update: { userId },
        create: { userId, token },
    });
};

export const getUserNotifications = async (userId) => {
    console.log(`[Service] Finding notifications for recipient: ${userId}`);
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[Service] Found ${notifications.length} notifications in DB.`);
        return notifications;
    } catch (dbError) {
        console.error('[Service] Prisma Error in getUserNotifications:', dbError);
        throw new AppError('Failed to fetch notifications from database.', 500);
    }
};

export const sendPushNotification = async (userIds, notification, data = {}) => {
  try {
    const userTokens = await prisma.fcmToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    if (userTokens.length === 0) {
      console.log(`[Service] No FCM tokens found for user(s). Cannot send notification.`);
      return;
    }
    const tokens = userTokens.map(t => t.token);
    const message = { notification, data, tokens };
    const response = await admin.messaging().sendMulticast(message);
    console.log(`[Service] Push notifications sent: ${response.successCount} success, ${response.failureCount} failure.`);
    if (response.failureCount > 0) {
        const tokensToDelete = response.responses
            .map((resp, idx) => !resp.success ? tokens[idx] : null)
            .filter(token => token !== null);
        if (tokensToDelete.length > 0) {
            await prisma.fcmToken.deleteMany({ where: { token: { in: tokensToDelete } } });
            console.log(`[Service] Cleaned up ${tokensToDelete.length} invalid FCM tokens.`);
        }
    }
  } catch (error) {
    console.error(`[Service] Failed to send push notification:`, error);
  }
};

export const sendNotificationToGymMembers = async (ownerId, gymId, { title, message }) => {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.managerId !== ownerId) throw new AppError('Gym not found or you do not own it.', 403);
    
    const activeSubs = await prisma.subscription.findMany({
        where: { status: 'active', gymPlan: { gymId } },
        select: { userId: true },
    });
    if (activeSubs.length === 0) throw new AppError('This gym has no active members.', 404);
    
    const memberIds = activeSubs.map(sub => sub.userId);
    await prisma.notification.createMany({
      data: memberIds.map(id => ({ recipientId: id, gymId, title, message }))
    });
    await sendPushNotification(memberIds, { title, body: message }, { gymId });
    return memberIds.length;
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId }
  });
  
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
};

export const deleteNotification = async (userId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId }
  });
  
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  
  return await prisma.notification.delete({
    where: { id: notificationId }
  });
};

export const updateNotificationSettings = async (userId, settings) => {
  return settings;
};