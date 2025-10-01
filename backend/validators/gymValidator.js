// src/validators/gymValidator.js

import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    return next(new AppError(errorMessage, 400));
  }
  return next();
};

const cuidSchema = Joi.string().length(25).required(); // CUIDs are 25 chars long

// --- Schemas ---



export const getAllGymsSchema = Joi.object({
  lat: Joi.number().optional(),
  lon: Joi.number().optional(),
  radius: Joi.number().positive().default(10),       // in km, positive number, default 10
  page: Joi.number().integer().min(1).default(1),    // pagination page, default 1
  limit: Joi.number().integer().min(1).default(50),  // pagination limit, default 50 matching frontend
  sort: Joi.string().valid('distance', 'rating', 'price', 'name').default('distance'),
  filter: Joi.string().valid('all', 'premium', 'standard', 'express', 'open').default('all'),
  search: Joi.string().allow('').optional()          // allow empty string or undefined
}).options({ convert: true }); // Enable automatic string->number conversion


export const gymIdParamSchema = Joi.object({
  id: cuidSchema.label('Gym ID'),
});

export const planIdParamSchema = Joi.object({
  planId: cuidSchema.label('Plan ID'),
});

export const updateGymSchema = Joi.object({
  id: cuidSchema.label('Gym ID').required(), // From params
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  photos: Joi.array().items(Joi.string().uri()).optional(),
  facilities: Joi.array().items(Joi.string()).optional(),
});

export const checkInSchema = Joi.object({
  gymId: cuidSchema.required(),
});

export const checkOutSchema = Joi.object({
  checkInId: cuidSchema.required(),
});

export const gymAndTrainerIdSchema = Joi.object({
  gymId: cuidSchema.required(),
  trainerUserId: cuidSchema.required(),
});

export const createPlanSchema = Joi.object({
  gymId: cuidSchema.required(),
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  duration: Joi.string().required(),
});

export const updatePlanSchema = Joi.object({
  planId: cuidSchema.required(),
  name: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  duration: Joi.string().optional(),
});

export default validate;

