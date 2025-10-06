// src/services/notificationService.js
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// Initialize Firebase Admin with error handling
console.log('[Service] Initializing Firebase Admin SDK...');
try {
    if (!admin.apps.length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("FIREBASE_PRIVATE_KEY is not defined in environment variables.");
        }
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        console.log('[Service] Firebase Admin SDK initialized successfully.');
    } else {
        console.log('[Service] Firebase Admin SDK already initialized.');
    }
} catch (error) {
    console.error('[Service] FATAL: Could not initialize Firebase Admin SDK.', error);
    // Depending on your setup, you might want to exit the process
    // process.exit(1);
}

// =================================================================
// ADMIN SERVICES
// =================================================================

export const getAllNotificationsForAdmin = async () => {
    console.log(`[Service] Fetching all notifications for admin.`);
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                recipient: { select: { email: true } },
                gym: { select: { name: true } }
            }
        });
        console.log(`[Service] Found ${notifications.length} notifications in DB.`);
        return notifications;
    } catch (error) {
        console.error('[Service] Error in getAllNotificationsForAdmin:', error);
        throw new AppError('Failed to fetch notifications from database.', 500);
    }
};

export const createNotificationForAllUsers = async ({ title, message }) => {
    console.log(`[Service] Creating notification for ALL users. Title: "${title}"`);
    try {
        const users = await prisma.user.findMany({ select: { id: true } });
        if (users.length === 0) {
            console.log('[Service] No users found in the database to notify.');
            return 0;
        }
        
        const recipientIds = users.map(u => u.id);
        console.log(`[Service] Found ${recipientIds.length} users. Creating DB entries...`);

        const dbResult = await prisma.notification.createMany({
            data: recipientIds.map(id => ({ recipientId: id, title, message }))
        });
        console.log(`[Service] Successfully created ${dbResult.count} notification records in DB.`);

        console.log(`[Service] Attempting to send push notifications...`);
        await sendPushNotification(recipientIds, { title, body: message }, {});
        
        return recipientIds.length;
    } catch (error) {
        console.error('[Service] Error in createNotificationForAllUsers:', error);
        throw new AppError('Failed to create notification for all users.', 500);
    }
};

export const createNotificationForRole = async ({ role, title, message }) => {
    console.log(`[Service] Creating notification for ROLE: ${role}. Title: "${title}"`);
    try {
        const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
        if (users.length === 0) {
            console.log(`[Service] No users found with role '${role}'.`);
            return 0;
        }

        const recipientIds = users.map(u => u.id);
        console.log(`[Service] Found ${recipientIds.length} users with role '${role}'. Creating DB entries...`);
        await prisma.notification.createMany({
            data: recipientIds.map(id => ({ recipientId: id, title, message }))
        });
        console.log(`[Service] Successfully created notification records in DB.`);

        await sendPushNotification(recipientIds, { title, body: message }, { role });
        return recipientIds.length;
    } catch (error) {
        console.error(`[Service] Error in createNotificationForRole for role ${role}:`, error);
        throw new AppError(`Failed to create notification for role ${role}.`, 500);
    }
};

export const createNotificationForUser = async ({ userId, title, message }) => {
    console.log(`[Service] Creating notification for USER ID: ${userId}. Title: "${title}"`);
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log(`[Service] User with ID ${userId} not found.`);
            throw new AppError('User not found.', 404);
        }

        await prisma.notification.create({
            data: { recipientId: userId, title, message }
        });
        console.log(`[Service] Successfully created notification record in DB for user ${userId}.`);

        await sendPushNotification([userId], { title, body: message }, {});
    } catch (error) {
        console.error(`[Service] Error in createNotificationForUser for user ${userId}:`, error);
        throw error; // Re-throw AppError or other errors
    }
};

export const createNotificationForGymMembers = async ({ gymId, title, message }) => {
    console.log(`[Service] Creating notification for GYM ID: ${gymId}. Title: "${title}"`);
    try {
        const activeSubs = await prisma.subscription.findMany({
            where: { status: 'active', gymPlan: { gymId } },
            select: { userId: true },
        });
        if (activeSubs.length === 0) {
            console.log(`[Service] No active members found for gym ID ${gymId}.`);
            return 0;
        }
        
        const memberIds = activeSubs.map(sub => sub.userId);
        console.log(`[Service] Found ${memberIds.length} active members for gym ${gymId}. Creating DB entries...`);
        await prisma.notification.createMany({
            data: memberIds.map(id => ({ recipientId: id, gymId, title, message }))
        });
        console.log(`[Service] Successfully created notification records in DB.`);

        await sendPushNotification(memberIds, { title, body: message }, { gymId });
        return memberIds.length;
    } catch (error) {
        console.error(`[Service] Error in createNotificationForGymMembers for gym ${gymId}:`, error);
        throw new AppError(`Failed to create notification for gym members.`, 500);
    }
};

export const deleteNotificationAdmin = async (notificationId) => {
    console.log(`[Service] Deleting notification ID: ${notificationId}`);
    try {
        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification) {
            console.log(`[Service] Notification with ID ${notificationId} not found.`);
            throw new AppError('Notification not found.', 404);
        }
        await prisma.notification.delete({ where: { id: notificationId } });
        console.log(`[Service] Successfully deleted notification ${notificationId}.`);
    } catch (error) {
        console.error(`[Service] Error in deleteNotificationAdmin for ID ${notificationId}:`, error);
        throw error;
    }
};


// =================================================================
// EXISTING MEMBER/GYM OWNER SERVICES (Unchanged, but with more logs)
// =================================================================

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
  console.log(`[Firebase Push] Preparing to send push notification to ${userIds.length} users.`);
  try {
    const userTokens = await prisma.fcmToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    if (userTokens.length === 0) {
      console.log(`[Firebase Push] No FCM tokens found for user(s). Aborting push.`);
      return;
    }
    const tokens = userTokens.map(t => t.token);
    console.log(`[Firebase Push] Found ${tokens.length} FCM tokens. Sending message...`);
    const message = { notification, data, tokens };
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`[Firebase Push] Response:`, response); // Log the full response
    console.log(`[Firebase Push] Push notifications sent: ${response.successCount} success, ${response.failureCount} failure.`);
    
    if (response.failureCount > 0) {
        console.log(`[Firebase Push] Some notifications failed. Cleaning up invalid tokens.`);
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`[Firebase Push] Token ${tokens[idx]} failed. Reason:`, resp.error);
                failedTokens.push(tokens[idx]);
            }
        });
        if (failedTokens.length > 0) {
            await prisma.fcmToken.deleteMany({ where: { token: { in: failedTokens } } });
            console.log(`[Firebase Push] Cleaned up ${failedTokens.length} invalid FCM tokens from DB.`);
        }
    }
  } catch (error) {
    console.error(`[Firebase Push] FATAL: Failed to send push notification:`, error);
    // Do not throw an error here to avoid crashing the whole notification process
    // if only the push part fails.
  }
};

// ... (other functions remain the same)
