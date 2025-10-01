// src/controllers/dashboardController.js
import * as dashboardService from '../services/dashboardService.js';
import catchAsync from '../utils/catchAsync.js';

export const getMemberDashboard = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const dashboardData = await dashboardService.buildMemberDashboard(userId);
  
  res.status(200).json({
    success: true,
    data: dashboardData,
  });
});