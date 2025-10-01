// src/controllers/notificationController.js
import * as notificationService from '../services/notificationService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Helper function to safely get the user ID
const getUserId = (req) => {
    // Try multiple possible locations for the user ID
    let userId = null;
    
    if (req.user && req.user.sub) {
        userId = req.user.sub;
    } else if (req.user && req.user.id) {
        userId = req.user.id;
    } else if (req.auth && req.auth.sub) {
        userId = req.auth.sub;
    } else if (req.auth && req.auth.payload && req.auth.payload.sub) {
        userId = req.auth.payload.sub;
    } else if (req.headers.authorization) {
        // Try to extract from JWT token as a fallback
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            userId = decoded.sub || decoded.id;
        } catch (e) {
            console.error('[Controller Error] Failed to decode JWT token:', e);
        }
    }
    
    if (!userId) {
        console.error('[Controller Error] User ID not found in request. Auth middleware may have failed.');
        console.log('[Controller Debug] Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('[Controller Debug] Request user object:', JSON.stringify(req.user, null, 2));
        console.log('[Controller Debug] Request auth object:', JSON.stringify(req.auth, null, 2));
        throw new AppError('Authentication failed: User information is missing.', 401);
    }
    
    return userId;
};

export const registerFcmToken = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    console.log(`[Controller] Registering FCM token for user: ${userId}`);
    await notificationService.saveUserFcmToken(userId, req.body.token);
    res.status(200).json({ success: true, message: 'Token registered.' });
});

export const getMyNotifications = catchAsync(async (req, res) => {
    console.log('[Controller] getMyNotifications: START');
    
    const userId = getUserId(req);
    console.log(`[Controller] Fetching notifications for user: ${userId}`);
    
    const notifications = await notificationService.getUserNotifications(userId);
    
    console.log(`[Controller] Successfully fetched ${notifications.length} notifications.`);
    res.status(200).json({ success: true, data: notifications });
});

export const sendNotificationToGymMembers = catchAsync(async (req, res) => {
    const ownerId = getUserId(req);
    const { gymId } = req.params;
    console.log(`[Controller] Owner ${ownerId} sending notification to gym ${gymId}`);
    const memberCount = await notificationService.sendNotificationToGymMembers(ownerId, gymId, req.body);
    res.status(200).json({ success: true, message: `Notification sent to ${memberCount} members.` });
});

export const markAsRead = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    console.log(`[Controller] Marking notification ${id} as read for user: ${userId}`);
    await notificationService.markNotificationAsRead(userId, id);
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
});

export const deleteNotification = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    console.log(`[Controller] Deleting notification ${id} for user: ${userId}`);
    await notificationService.deleteNotification(userId, id);
    res.status(200).json({ success: true, message: 'Notification deleted.' });
});

export const sendNotificationToUser = catchAsync(async (req, res) => {
    const ownerId = getUserId(req);
    const { userId } = req.params;
    const { title, message } = req.body;

    console.log(`[Controller] Owner ${ownerId} sending notification to user ${userId}`);

    // Prisma logic here (assuming it's correct)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const subscriptions = await prisma.subscription.findMany({
        where: { userId, status: 'active', gymPlan: { gym: { managerId: ownerId } } }
    });

    if (subscriptions.length === 0) {
        return res.status(403).json({ success: false, message: "User is not an active member of your gyms." });
    }

    await prisma.notification.create({
        data: { recipientId: userId, gymId: subscriptions[0].gymPlan.gymId, title, message }
    });

    await notificationService.sendPushNotification([userId], { title, body: message }, {});

    res.status(200).json({ success: true, message: `Notification sent to user` });
});