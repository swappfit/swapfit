import * as adminService from '../services/adminService.js';
import catchAsync from '../utils/catchAsync.js';

export const getPendingGyms = catchAsync(async (req, res) => {
    const gyms = await adminService.getPendingGyms();
    res.status(200).json({ success: true, data: gyms });
});

export const updateGymStatus = catchAsync(async (req, res) => {
    const { gymId } = req.params;
    const { status } = req.body;
    const updatedGym = await adminService.updateGymStatus(gymId, status);
    res.status(200).json({ success: true, message: `Gym status updated to ${status}.`, data: updatedGym });
});

export const updateGymBadges = catchAsync(async (req, res) => {
    const { gymId } = req.params;
    const { badges } = req.body;
    const updatedGym = await adminService.updateGymBadges(gymId, badges);
    res.status(200).json({ success: true, message: 'Gym badges updated.', data: updatedGym });
});

/**
 * @description Controller to get all stats for the Admin Dashboard.
 */
export const getAdminDashboard = catchAsync(async (req, res) => {
    const stats = await adminService.getAdminDashboardStats();
    res.status(200).json({ success: true, data: stats });
});

/**
 * @description List users for admin with optional pagination, role filter, status filter, and search
 */
// In adminController.js

/**
 * @description List users for admin with optional pagination, role filter, status filter, and search
 */
export const getUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  const result = await adminService.getUsers({
    page: Number(page),
    limit: Number(limit),
    role: role && String(role),
    status: status && String(status),
    search: search && String(search),
  });
  
  // Ensure we have the correct structure
  const response = {
    users: result.users || [],
    pagination: {
      page: result.page || 1,
      limit: result.limit || 20,
      total: result.total || 0,
      totalPages: result.totalPages || 0,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1
    }
  };
  
  res.status(200).json({ 
    success: true, 
    data: response
  });
});

/**
 * @description Controller to get user statistics.
 */

/**
 * @description Controller for sending a broadcast notification to all users.
 */
export const sendBroadcastNotification = catchAsync(async (req, res, next) => {
  const userCount = await adminService.sendBroadcastNotification(req.body);

  res.status(200).json({
    success: true,
    message: `Broadcast notification successfully sent to ${userCount} users.`,
  });
});

/**
 * @description Admin schedules placeholder list (hook for future class schedules)
 */
export const getSchedules = catchAsync(async (req, res) => {
  const items = await adminService.getSchedules();
  res.status(200).json({ success: true, data: items });
});

/**
 * @description Controller to get all available multi-gym tiers.
 */
export const getMultiGymTiers = catchAsync(async (req, res) => {
    const tiers = await adminService.getMultiGymTiers();
    res.status(200).json({ success: true, data: tiers });
});

/**
 * @description Controller to assign a gym to a predefined tier.
 */
// In your adminController.js

/**
 * @description Controller to assign a gym to a predefined tier.
 */
export const assignGymToTier = catchAsync(async (req, res) => {
    console.log('🏷️ [Admin Controller] assignGymToTier - Starting execution');
    console.log('🏷️ [Admin Controller] Request user:', req.user);
    console.log('🏷️ [Admin Controller] Request params:', req.params);
    console.log('🏷️ [Admin Controller] Request body:', req.body);
    
    try {
        const { gymId } = req.params;
        const { tierName } = req.body; // e.g., { tierName: "Platinum" }
        
        console.log('🏷️ [Admin Controller] Extracted gymId:', gymId);
        console.log('🏷️ [Admin Controller] Extracted tierName:', tierName);
        
        if (!gymId) {
            console.error('🏷️ [Admin Controller] Missing gymId in params');
            return res.status(400).json({ 
                success: false, 
                message: 'Gym ID is required' 
            });
        }
        
        if (!tierName) {
            console.error('🏷️ [Admin Controller] Missing tierName in body');
            return res.status(400).json({ 
                success: false, 
                message: 'Tier name is required' 
            });
        }
        
        console.log('🏷️ [Admin Controller] Calling adminService.assignGymToTier()');
        const startTime = Date.now();
        
        const updatedGym = await adminService.assignGymToTier(gymId, tierName);
        
        const duration = Date.now() - startTime;
        console.log(`🏷️ [Admin Controller] Service completed in ${duration}ms`);
        console.log('🏷️ [Admin Controller] Service returned gym:', updatedGym ? updatedGym.name : 'null/undefined');
        
        if (!updatedGym) {
            console.error('🏷️ [Admin Controller] Service returned null/undefined');
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to assign tier: Service returned null' 
            });
        }
        
        console.log('🏷️ [Admin Controller] Sending successful response');
        res.status(200).json({ 
            success: true, 
            message: `Gym assigned to ${tierName} tier.`, 
            data: updatedGym 
        });
    } catch (error) {
        console.error('🏷️ [Admin Controller] Error in assignGymToTier:', error);
        console.error('🏷️ [Admin Controller] Error stack:', error.stack);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to assign tier', 
                error: error.message 
            });
        }
    }
});

/**
 * @description Controller to get all subscriptions.
 */
export const getAllSubscriptions = catchAsync(async (req, res) => {
    const subscriptions = await adminService.getAllSubscriptions();
    res.status(200).json({ success: true, data: subscriptions });
});

/**
 * @description Controller to get multi-gym subscriptions (public endpoint).
 */
export const getMultiGymSubscriptions = catchAsync(async (req, res) => {
    const subscriptions = await adminService.getMultiGymSubscriptions();
    res.status(200).json({ success: true, data: subscriptions });
});

/**
 * @description Controller to get subscription by ID.
 */
export const getSubscriptionById = catchAsync(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await adminService.getSubscriptionById(subscriptionId);
    res.status(200).json({ success: true, data: subscription });
});

/**
 * @description Controller to cancel user subscription.
 */
export const cancelUserSubscription = catchAsync(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await adminService.cancelUserSubscription(subscriptionId);
    res.status(200).json({ success: true, message: 'Subscription cancelled successfully.', data: subscription });
});

/**
 * @description Controller to get subscription statistics.
 */
export const getSubscriptionStats = catchAsync(async (req, res) => {
    const stats = await adminService.getSubscriptionStats();
    res.status(200).json({ success: true, data: stats });
});

/**
 * @description Controller to get all transactions.
 */
export const getAllTransactions = catchAsync(async (req, res) => {
    const transactions = await adminService.getAllTransactions();
    res.status(200).json({ success: true, data: transactions });
});

/**
 * @description Controller to get all plans (gym and trainer).
 */
export const getAllPlans = catchAsync(async (req, res) => {
    const plans = await adminService.getAllPlans();
    res.status(200).json({ success: true, data: plans });
});

/**
 * @description Controller to get all gyms.
 */
export const getAllGyms = catchAsync(async (req, res) => {
    const gyms = await adminService.getAllGyms();
    res.status(200).json({ success: true, data: gyms });
});

/**
 * @description Controller to get users with their subscriptions.
 */
export const getUsersWithSubscriptions = catchAsync(async (req, res) => {
    const users = await adminService.getUsersWithSubscriptions();
    res.status(200).json({ success: true, data: users });
});

/**
 * @description Controller to get user statistics.
 */
export const getUserStats = catchAsync(async (req, res) => {
    const stats = await adminService.getUserStats();
    res.status(200).json({ success: true, data: stats });
});;
/**
 * @description Controller to get gyms that have opted in for multi-gym access
 */
export const getGymsForBadging = catchAsync(async (req, res) => {
    console.log('🏋️ [Admin Controller] getGymsForBadging - Starting execution');
    console.log('🏋️ [Admin Controller] Request user:', req.user);
    
    try {
        console.log('🏋️ [Admin Controller] Calling adminService.getGymsForBadging()');
        const gyms = await adminService.getGymsForBadging();
        console.log('🏋️ [Admin Controller] Service returned gyms:', gyms ? `${gyms.length} gyms` : 'null/undefined');
        
        if (!gyms) {
            console.error('🏋️ [Admin Controller] Service returned null/undefined');
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch gyms: Service returned null' 
            });
        }
        
        console.log('🏋️ [Admin Controller] Sending successful response');
        res.status(200).json({ success: true, data: gyms });
    } catch (error) {
        console.error('🏋️ [Admin Controller] Error in getGymsForBadging:', error);
        console.error('🏋️ [Admin Controller] Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch gyms', 
            error: error.message 
        });
    }
});