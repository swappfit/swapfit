// src/controllers/userController.js
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

// Helper function to get user ID from either JWT or Auth0
const getUserId = async (req) => {
  if (req.auth?.payload) {
    const user = await authService.getUserByAuth0Id(req.auth.payload.sub);
    if (!user) throw new Error('User not found for the given Auth0 ID.');
    return user.id;
  }
  if (req.user?.id) {
    return req.user.id;
  }
  throw new Error('Authentication failed: No user identifier found in request.');
};

export const changePassword = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  const { currentPassword, newPassword } = req.body;
  await userService.changeUserPassword(userId, currentPassword, newPassword);
  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

/**
 * A single, intelligent endpoint to update the user's profile.
 * The service layer handles the logic of which profile to update based on the user's role.
 */
export const updateMyProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  // Pass the entire user object from the token and the request body to the service
  const updatedProfile = await userService.updateUserProfile({ id: userId }, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updatedProfile });
});

export const getMyProfile = catchAsync(async (req, res) => {
  const userId = await getUserId(req);
  // We exclude the password from the response for security
  const { password, ...userProfile } = await userService.getUserProfile(userId);
  res.status(200).json({ success: true, data: userProfile });
});

// Auth0-specific profile endpoints
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
