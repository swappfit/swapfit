// src/controllers/bookingController.js

import * as bookingService from '../services/bookingService.js';

// A utility to wrap async functions and catch errors
import catchAsync from '../utils/catchAsync.js';
/**
 * @description Creates a "stubbed" checkout session for a one-time booking.
 * In the future, this will return a real Chargebee Hosted Page URL.
 */
export const createBookingCheckout = catchAsync(async (req, res, next) => {
  const result = await bookingService.createBookingCheckout(req.user.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Booking checkout session created.',
    data: result, // Contains the { checkoutUrl: '...' }
  });
});

/**
 * @description Retrieves all bookings for the currently logged-in user.
 */
export const getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await bookingService.getMyBookings(req.user.id);
  
  res.status(200).json({
    success: true,
    data: bookings,
  });
});

/**
 * @description Allows a Gym Owner to set or update the prices for their day/week passes.
 */
export const setPassPrices = catchAsync(async (req, res, next) => {
    const updatedGym = await bookingService.setGymPassPrices(req.user.id, req.params.gymId, req.body);

    res.status(200).json({
        success: true,
        message: 'Pass prices have been updated successfully.',
        data: updatedGym,
    });
});

