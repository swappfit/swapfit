// src/routes/authRoutes.js

import express from 'express';
import * as authController from '../controllers/authController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';

import validate, {
  selectRoleSchema,
  createMemberProfileSchema,
  createTrainerProfileSchema,
  createGymProfileSchema,
  createMerchantProfileSchema
} from '../validators/authValidator.js';

const router = express.Router();

// --- Client-Specific Verification Endpoints ---
router.post('/verify-user', auth0Middleware, authController.verifyUser);
router.post('/verify-member', auth0Middleware, authController.verifyMember);
router.post('/verify-user-admin', auth0Middleware, authController.verifyUserForAdmin);
const flattenMemberProfileData = (req, res, next) => {
  const { body } = req;
  if (body.weight && typeof body.weight === 'object') {
    body.weight = body.weight.value;
  }
  if (body.height && typeof body.height === 'object') {
    body.height = body.height.value;
  }
  next();
};
// --- All Subsequent Onboarding and Profile Routes ---

router.post(
    '/select-role',
    authGatekeeper,
    validate(selectRoleSchema),
    authController.selectRole
);

// This route does not need the unwrapper as the data is sent flat
router.post(
    '/create-member-profile',
    authGatekeeper,
    flattenMemberProfileData,
    validate(createMemberProfileSchema),
    authController.createMemberProfile
);


// ✅✅✅ THE FIX IS HERE: Re-introducing the unwrapper middleware ✅✅✅

// This small middleware checks if the data is nested. If so, it replaces
// req.body with the nested data object, so the validator receives the
// correct structure.
const unwrapData = (req, res, next) => {
  if (req.body && req.body.data) {
    req.body = req.body.data;
  }
  next();
};

router.post(
    '/create-trainer-profile',
    authGatekeeper,
    unwrapData, // <-- Unwraps req.body.data before validation
    validate(createTrainerProfileSchema),
    authController.createTrainerProfile
);

router.post(
    '/create-gym-profile',
    authGatekeeper,
    unwrapData, // <-- Unwraps req.body.data before validation
    validate(createGymProfileSchema),
    authController.createGymProfile
);

router.post(
    '/create-merchant-profile',
    authGatekeeper,
    unwrapData, // <-- Unwraps req.body.data before validation
    validate(createMerchantProfileSchema),
    authController.createMerchantProfile
);

export default router;