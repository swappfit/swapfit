// src/validators/adminValidator.js

import Joi from 'joi';
import AppError from '../utils/AppError.js';

/**
 * Reusable validation middleware factory.
 * Takes a Joi schema and returns an Express middleware function.
 */
const validate = (schema) => (req, res, next) => {
  // We validate against a combination of body, params, and query for flexibility
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  
  if (error) {
    // If validation fails, format the error message and pass it to the global error handler.
    const errorMessage = error.details.map((detail) => detail.message).join('; ');
    return next(new AppError(errorMessage, 400)); // 400 for Bad Request
  }

  // If validation succeeds, proceed to the next middleware or controller.
  return next();
};

const cuidSchema = Joi.string().length(25).required();

// --- Schemas for Gym Management by Admin ---

export const updateGymStatusSchema = Joi.object({
  gymId: cuidSchema.label('Gym ID').required(),
  status: Joi.string().valid('approved', 'rejected').required(),
});

export const updateGymBadgesSchema = Joi.object({
    gymId: cuidSchema.label('Gym ID').required(),
    badges: Joi.array().items(Joi.string()).required(),
});


// --- Schemas for Challenge Management by Admin ---

export const createChallengeSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  metric: Joi.string().valid('steps', 'workouts').required(),
  goal: Joi.number().integer().positive().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
});

export const updateChallengeSchema = Joi.object({
  id: cuidSchema.label('Challenge ID').required(), // From params
  name: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  goal: Joi.number().integer().positive().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const challengeIdParamSchema = Joi.object({
    id: cuidSchema.label('Challenge ID').required(),
});


// --- Schema for Broadcast Notifications by Admin ---

export const broadcastNotificationSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  message: Joi.string().trim().min(3).max(500).required(),
});


// Export the middleware as the default export for convenience
export default validate;

