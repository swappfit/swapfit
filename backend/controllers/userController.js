import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

// Helper function to get user ID from either JWT or Auth0
const getUserId = async (req) => {
  if (req.user?.id) {
    return req.user.id;
  }
  
  if (req.auth?.payload) {
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) throw new Error('User not found for the given Auth0 ID.');
    return user.id;
  }
  
  throw new Error('Authentication failed: No user identifier found in request.');
};

export const changePassword = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { currentPassword, newPassword } = req.body;
  await userService.changeUserPassword(userId, currentPassword, newPassword);
  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const updatedProfile = await userService.updateUserProfile({ id: userId }, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updatedProfile });
});

export const getMyProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { password, ...userProfile } = await userService.getUserProfile(userId);
  res.status(200).json({ success: true, data: userProfile });
});

export const getUserProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { password, ...userProfile } = await userService.getUserProfile(userId);
  res.status(200).json({ success: true, data: userProfile });
});

export const getUserStats = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const stats = await userService.getUserStats(userId);
  res.status(200).json({ success: true, data: stats });
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const updatedProfile = await userService.updateUserProfile({ id: userId }, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updatedProfile });
});

/**
 * @description Fetches the user's active check-ins.
 */
export const getUserCheckIns = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const checkIns = await userService.getUserCheckIns(userId);
  res.status(200).json({ success: true, data: checkIns });
});

/**
 * @description Get user's subscriptions
 */
export const getUserSubscriptions = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const subscriptions = await userService.getUserSubscriptions(userId);
  res.status(200).json({ success: true, data: subscriptions });
});