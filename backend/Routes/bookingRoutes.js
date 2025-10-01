// Routes/bookingRoutes.js

import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import roleAuth from '../middlewares/roleAuth.js';
import validate, {
  createBookingCheckoutSchema,
  setPassPricesSchema,
  gymIdParamSchema
} from '../validators/bookingValidator.js'; // Assumes validator file exists

const router = express.Router();

// Apply JWT authentication to all booking-related routes
router.use(jwtAuth);


// --- Member-Facing Routes ---

/**
 * @route   POST /api/bookings/checkout
 * @desc    Initiates a one-time payment checkout for a gym pass.
 * @access  Private (Authenticated User)
 */
router.post(
    '/checkout',
    validate(createBookingCheckoutSchema),
    bookingController.createBookingCheckout
);

/**
 * @route   GET /api/bookings/me
 * @desc    Retrieves the logged-in user's booking history.
 * @access  Private (Authenticated User)
 */
router.get(
    '/me',
    bookingController.getMyBookings
);


// --- Gym Owner-Facing Route ---

/**
 * @route   PATCH /api/bookings/gyms/:gymId/prices
 * @desc    Allows a Gym Owner to set the prices for their one-time passes.
 * @access  Private (GYM_OWNER role required)
 */
router.patch(
    '/gyms/:gymId/prices',
    roleAuth('GYM_OWNER'),
    validate(gymIdParamSchema),
    validate(setPassPricesSchema),
    bookingController.setPassPrices
);


export default router;

