// src/controllers/dietController.// src/controllers/dietController.js
import * as dietService from '../services/dietService.js';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

// Helper function to get user ID from either JWT or Auth0
const getUserId = async (req) => {
  // If Auth0 middleware was used and set req.auth
  if (req.auth?.payload?.sub) {
    console.log('[DietController] Using Auth0 user ID from payload');
    // Get our internal database user ID from the Auth0 'sub' identifier
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) throw new Error('User not found for the given Auth0 ID.');
    return user.id;
  }
  // If a different JWT middleware was used and set req.user
  if (req.user?.id) {
    console.log('[DietController] Using JWT user ID');
    return req.user.id;
  }
  // If no user information is found
  throw new Error('Authentication failed: No user identifier found in request.');
};

export const logDietEntry = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  console.log(`[DietController] Attaching diet log to user ID: ${userId}`);
  const newEntry = await dietService.createLog(userId, req.body);
  res.status(201).json({ success: true, message: 'Diet entry logged successfully.', data: newEntry });
});

export const getDietLogsByDate = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { date } = req.params;
  const result = await dietService.getLogsByDate(userId, date);
  res.status(200).json({ success: true, data: result });
});

export const updateDietLog = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { logId } = req.params;
  const updatedLog = await dietService.updateLog(userId, logId, req.body);
  res.status(200).json({ success: true, message: 'Diet log updated successfully.', data: updatedLog });
});

export const deleteDietLog = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { logId } = req.params;
  await dietService.deleteLog(userId, logId);
  res.status(204).send(); // 204 No Content for successful deletion
});
