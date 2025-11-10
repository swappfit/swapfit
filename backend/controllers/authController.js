// src/controllers/authController.js

import * as authService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { generateInternalToken } from '../utils/tokenUtils.js';


// --- Auth0 Verification & Token Exchange ---
export const verifyUser = catchAsync(async (req, res, next) => {
  const auth0Payload = req.auth?.payload;
  if (!auth0Payload) {
    throw new AppError('Auth0 token is missing or invalid.', 401);
  }
  const user = await authService.verifyAuth0User(auth0Payload);
  const internalToken = generateInternalToken(user);
  res.status(200).json({
    success: true,
    message: 'User verified successfully.',
    data: { token: internalToken, user: user },
  });
});

export const verifyMember = catchAsync(async (req, res, next) => {
  const auth0Payload = req.auth.payload;
  if (!auth0Payload) {
    throw new AppError('Auth0 token payload is missing.', 401);
  }
  const user = await authService.verifyMember(auth0Payload);
  res.status(200).json({
    success: true,
    message: 'Member verified successfully.',
    data: { user: user },
  });
});

// --- Profile & Role Management ---
export const selectRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const userId = req.user.id;
  
  // --- DEBUG STEP 1: Confirming the function starts ---
  console.log(`[selectRole Controller] User ${userId} selected role ${role}.`);

  const result = await authService.selectRole({ userId, role });

  // --- DEBUG STEP 2: Confirming the role was updated in the service ---
  console.log(`[selectRole Controller] Role updated. Redirecting to: ${result.redirectTo}`);
  
  try {
    const updatedUser = await authService.getFullUserById(userId);

    // --- DEBUG STEP 3: LOG THE OBJECT THAT IS CAUSING THE PROBLEM ---
    console.log('[selectRole Controller] Fetched full user object. It looks like this:');
    console.dir(updatedUser, { depth: null }); // This prints the full object

    const newToken = generateInternalToken(updatedUser);
    
    // --- DEBUG STEP 4: Confirming we are about to send the response ---
    console.log('[selectRole Controller] Token generated. Sending success response to client.');

    res.status(200).json({
      success: true,
      message: 'Role selected successfully.',
      data: { token: newToken, user: updatedUser, redirectTo: result.redirectTo },
    });

  } catch (error) {
    // --- DEBUG STEP 5: Catching any errors during the process ---
    console.error('[selectRole Controller] CRITICAL ERROR after role update but before response:', error);
    // Pass the error to the global error handler
    next(error); 
  }
});

export const createMemberProfile = catchAsync(async (req, res, next) => {
  const authPayload = req.auth?.payload;
  if (!authPayload) {
    throw new AppError('Authentication payload not found.', 401);
  }
  const profile = await authService.createProfile({
    authPayload: authPayload,
    profileType: 'MEMBER',
    data: req.body,
  });
  res.status(201).json({ success: true, message: "Member profile created successfully.", data: profile });
});

export const createTrainerProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  await authService.createProfile({
    userId,
    profileType: 'TRAINER',
    data: req.body,
  });

  const updatedUser = await authService.getFullUserById(userId);
  const newToken = generateInternalToken(updatedUser);

  res.status(201).json({
    success: true,
    message: 'Trainer profile created successfully.',
    data: {
      token: newToken,
      user: updatedUser,
    },
  });
});

export const createGymProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const profileData = req.body.data || req.body;
  await authService.createProfile({
    userId,
    profileType: 'GYM_OWNER',
    data: profileData,
  });

  const updatedUser = await authService.getFullUserById(userId);
  const newToken = generateInternalToken(updatedUser);

  res.status(201).json({
    success: true,
    message: 'Gym profile created successfully.',
    data: {
      token: newToken,
      user: updatedUser,
    },
  });
});

// ✅✅✅ UPDATED MERCHANT CONTROLLER FOR CONSISTENCY ✅✅✅
export const createMerchantProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // 1. Create the profile
  await authService.createProfile({ 
    userId, 
    profileType: 'MERCHANT', 
    data: req.body 
  });
  
  // 2. Get the full, up-to-date user object from the database
  const updatedUser = await authService.getFullUserById(userId);

  // 3. Generate a new token based on the true state of the user
  const newToken = generateInternalToken(updatedUser);

  // 4. Send the consistent response structure
  res.status(201).json({
    success: true,
    message: 'Merchant profile created successfully',
    data: {
      token: newToken,
      user: updatedUser,
    },
  });
});

// ✅✅✅ SIMPLIFIED AND ROBUST CONTROLLER (MIRRORS verifyUser) ✅✅✅
export const verifyUserForAdmin = catchAsync(async (req, res, next) => {
  console.log('--- [ADMIN VERIFY] Controller Start ---');
  
  const auth0Payload = req.auth?.payload;
  if (!auth0Payload) {
    throw new AppError('Auth0 token is missing or invalid.', 401);
  }

  // ✅ Use the new atomic service function. This is the ONLY call we need.
  const user = await authService.verifyAndPromoteToAdmin(auth0Payload);

  // Generate our own internal JWT
  const internalToken = generateInternalToken(user);

  res.status(200).json({
    success: true,
    message: 'User verified and authenticated as Admin.',
    data: {
      token: internalToken,
      user: user,
    },
  });
});