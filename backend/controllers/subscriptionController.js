// subscriptionController.js - Update getAllSubscriptions to include trainer ID
import * as subscriptionService from '../services/subscriptionService.js';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A new helper function to get the user ID regardless of token type
const getUserIdFromRequest = async (req) => {
    // If req.user exists (from an Internal JWT), we are done.
    if (req.user && req.user.id) {
        console.log(`[Subscription Controller] Found user ID (${req.user.id}) from Internal JWT.`);
        return req.user.id;
    }

    // If not, check req.auth (from the Auth0 middleware for mobile)
    if (req.auth && req.auth.payload && req.auth.payload.sub) {
        const auth0Id = req.auth.payload.sub;
        console.log(`[Subscription Controller] No internal user found. Finding user by Auth0 ID: ${auth0Id}`);
        const user = await authService.getUserByAuth0Id(auth0Id);
        if (!user) {
            throw new AppError('User from token not found in database.', 401);
        }
        console.log(`[Subscription Controller] Found user ID (${user.id}) from Auth0 token.`);
        return user.id;
    }

    // If neither is present, authentication has failed.
    throw new AppError('Could not identify user from token.', 401);
};

// NEW: Admin endpoint to fetch all subscriptions
export const getAllSubscriptions = catchAsync(async (req, res) => {
    // Check if user is admin
    const userId = await getUserIdFromRequest(req);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'ADMIN') {
        throw new AppError('Access denied. Admin privileges required.', 403);
    }
    
    // Fetch all subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
        include: {
            user: {
                include: {
                    memberProfile: true
                }
            },
            gymPlan: {
                include: {
                    gym: true
                }
            },
            trainerPlan: {
                include: {
                    trainer: {
                        include: {
                            user: {
                                include: {
                                    memberProfile: true
                                }
                            }
                        }
                    }
                }
            },
            multiGymTier: true
        },
        orderBy: {
            id: 'desc'
        }
    });
    
    // Format the data for the frontend
    const formattedSubscriptions = subscriptions.map(subscription => {
        const userAvatar = subscription.user.memberProfile?.name 
            ? subscription.user.memberProfile.name.substring(0, 2).toUpperCase()
            : (subscription.user.email || 'U')[0] + (subscription.user.email?.split('@')[0]?.[1] || 'N');
            
        return {
            id: subscription.id,
            userId: subscription.userId,
            userEmail: subscription.user.email,
            userName: subscription.user.memberProfile?.name || subscription.user.email?.split('@')[0] || 'Unknown',
            userAvatar: userAvatar,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            chargebeeSubscriptionId: subscription.chargebeeSubscriptionId,
            gymPlan: subscription.gymPlan,
            trainerPlan: subscription.trainerPlan,
            multiGymTier: subscription.multiGymTier
        };
    });
    
    res.status(200).json({ 
        success: true, 
        data: formattedSubscriptions 
    });
});

export const createCheckoutSession = catchAsync(async (req, res) => {
  // ✅✅✅ THE DEFINITIVE FIX IS HERE ✅✅✅
  const userId = await getUserIdFromRequest(req);
  
  const { planId, planType } = req.body;

  const checkoutUrl = await subscriptionService.createCheckoutSession({ userId, planId, planType });
  
  res.status(200).json({ success: true, data: { checkoutUrl } });
});

export const createPortalSession = catchAsync(async (req, res) => {
    console.log("--- Inside createPortalSession Controller ---");
    
    // Use the existing helper function to reliably get the user ID.
    const userId = await getUserIdFromRequest(req);
    
    console.log(`[Controller] Calling createPortalSession service for User ID: ${userId}`);
    const portalUrl = await subscriptionService.createPortalSession(userId);

    console.log("[Controller] Service returned a portal URL. Sending success response.");
    res.status(200).json({ success: true, data: { portalUrl } });
});

export const handleChargebeeWebhook = catchAsync(async (req, res) => {
    // Pass both the parsed body (for easy access to data) and the rawBody (for verification)
    await subscriptionService.processWebhook({
        parsedBody: req.body,
        rawBody: req.rawBody,
        headers: req.headers
    });
    res.status(200).send(); 
});

/**
 * @description Purchase multi-gym tier subscription
 */
export const purchaseMultiGymTier = catchAsync(async (req, res) => {
    const userId = await getUserIdFromRequest(req);
    const { tierId } = req.body;

    const checkoutUrl = await subscriptionService.createCheckoutSession({ 
        userId, 
        planId: tierId, 
        planType: 'MULTI_GYM' 
    });
    
    res.status(200).json({ success: true, data: { checkoutUrl } });
});

/**
 * @description Get user's multi-gym subscriptions
 */
export const getUserMultiGymSubscriptions = catchAsync(async (req, res) => {
    const userId = await getUserIdFromRequest(req);
    const subscriptions = await subscriptionService.getMultiGymSubscriptions(userId);
    res.status(200).json({ success: true, data: subscriptions });
});

/**
 * @description Cancel subscription
 */
export const cancelSubscription = catchAsync(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.cancelSubscription(subscriptionId);
    res.status(200).json({ success: true, message: 'Subscription cancelled successfully.', data: subscription });
});