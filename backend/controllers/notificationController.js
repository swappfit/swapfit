// src/controllers/notificationController.js
import * as notificationService from '../services/notificationService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Helper function to safely get the user ID
const getUserId = (req) => {
    let userId = null;
    if (req.user && req.user.sub) userId = req.user.sub;
    else if (req.user && req.user.id) userId = req.user.id;
    else if (req.auth && req.auth.sub) userId = req.auth.sub;
    else if (req.auth && req.auth.payload && req.auth.payload.sub) userId = req.auth.payload.sub;
    
    if (!userId) {
        throw new AppError('Authentication failed: User information is missing.', 401);
    }
    return userId;
};

// =================================================================
// ADMIN CONTROLLERS
// =================================================================

export const getAllNotificationsForAdmin = catchAsync(async (req, res) => {
    console.log('[Admin Controller] Fetching all notifications for admin dashboard.');
    try {
        const notifications = await notificationService.getAllNotificationsForAdmin();
        console.log(`[Admin Controller] Successfully fetched ${notifications.length} notifications.`);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error('[Admin Controller] Error in getAllNotificationsForAdmin:', error);
        throw error; // Re-throw for catchAsync to handle
    }
});

export const sendNotificationToAll = catchAsync(async (req, res) => {
    const { title, message } = req.body;
    console.log(`[Admin Controller] Request to send notification to ALL users. Title: "${title}"`);
    try {
        const recipientCount = await notificationService.createNotificationForAllUsers({ title, message });
        console.log(`[Admin Controller] Service reported sending to ${recipientCount} users.`);
        res.status(200).json({ success: true, message: `Notification sent to ${recipientCount} users.` });
    } catch (error) {
        console.error('[Admin Controller] Error in sendNotificationToAll:', error);
        throw error; // Re-throw for catchAsync to handle
    }
});

export const sendNotificationToRole = catchAsync(async (req, res) => {
    const { role, title, message } = req.body;
    console.log(`[Admin Controller] Request to send notification to ROLE: ${role}. Title: "${title}"`);
    try {
        const recipientCount = await notificationService.createNotificationForRole({ role, title, message });
        console.log(`[Admin Controller] Service reported sending to ${recipientCount} users with role '${role}'.`);
        res.status(200).json({ success: true, message: `Notification sent to ${recipientCount} users with role '${role}'.` });
    } catch (error) {
        console.error('[Admin Controller] Error in sendNotificationToRole:', error);
        throw error;
    }
});

export const sendNotificationToUserById = catchAsync(async (req, res) => {
    const { userId, title, message } = req.body;
    console.log(`[Admin Controller] Request to send notification to USER ID: ${userId}. Title: "${title}"`);
    try {
        await notificationService.createNotificationForUser({ userId, title, message });
        console.log(`[Admin Controller] Service reported successful send to user ${userId}.`);
        res.status(200).json({ success: true, message: `Notification sent to user ${userId}.` });
    } catch (error) {
        console.error('[Admin Controller] Error in sendNotificationToUserById:', error);
        throw error;
    }
});

export const sendNotificationToGymMembersAdmin = catchAsync(async (req, res) => {
    const { gymId, title, message } = req.body;
    console.log(`[Admin Controller] Request to send notification to GYM ID: ${gymId}. Title: "${title}"`);
    try {
        const recipientCount = await notificationService.createNotificationForGymMembers({ gymId, title, message });
        console.log(`[Admin Controller] Service reported sending to ${recipientCount} members of gym ${gymId}.`);
        res.status(200).json({ success: true, message: `Notification sent to ${recipientCount} members of gym ${gymId}.` });
    } catch (error) {
        console.error('[Admin Controller] Error in sendNotificationToGymMembersAdmin:', error);
        throw error;
    }
});

export const deleteNotificationAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(`[Admin Controller] Request to delete notification ID: ${id}`);
    try {
        await notificationService.deleteNotificationAdmin(id);
        console.log(`[Admin Controller] Service reported successful deletion of notification ${id}.`);
        res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error('[Admin Controller] Error in deleteNotificationAdmin:', error);
        throw error;
    }
});


// =================================================================
// EXISTING MEMBER/GYM OWNER CONTROLLERS (Unchanged)
// =================================================================

export const registerFcmToken = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    await notificationService.saveUserFcmToken(userId, req.body.token);
    res.status(200).json({ success: true, message: 'Token registered.' });
});

export const getMyNotifications = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const notifications = await notificationService.getUserNotifications(userId);
    res.status(200).json({ success: true, data: notifications });
});

export const sendNotificationToGymMembers = catchAsync(async (req, res) => {
    const ownerId = getUserId(req);
    const { gymId } = req.params;
    const memberCount = await notificationService.sendNotificationToGymMembers(ownerId, gymId, req.body);
    res.status(200).json({ success: true, message: `Notification sent to ${memberCount} members.` });
});

export const markAsRead = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    await notificationService.markNotificationAsRead(userId, id);
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
});

export const deleteNotification = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    await notificationService.deleteNotification(userId, id);
    res.status(200).json({ success: true, message: 'Notification deleted.' });
});

export const sendNotificationToUser = catchAsync(async (req, res) => {
    const ownerId = getUserId(req);
    const { userId } = req.params;
    const { title, message } = req.body;
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