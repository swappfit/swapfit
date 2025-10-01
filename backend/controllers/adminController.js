// src/controllers/adminController.js
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
 * @description List users for admin with optional pagination and role filter
 */
export const getUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const result = await adminService.getUsers({
    page: Number(page),
    limit: Number(limit),
    role: role && String(role),
  });
  res.status(200).json({ success: true, data: result });
});
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
