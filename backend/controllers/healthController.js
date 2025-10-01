// src/controllers/healthController.js
import * as healthService from '../services/healthService.js';

import catchAsync from '../utils/catchAsync.js';

export const syncHealthData = catchAsync(async (req, res, next) => {
  await healthService.syncData(req.user.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Data synced successfully.',
  });
});

export const getLastSyncTimestamps = catchAsync(async (req, res, next) => {
    const syncData = await healthService.getLastSyncTimes(req.user.id);
    res.status(200).json({ success: true, data: syncData });
});

