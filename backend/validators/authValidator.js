// src/validators/authValidator.js

import Joi from 'joi';
import AppError from '../utils/AppError.js';

// --- Reusable Validation Middleware ---
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join('; ');
    return next(new AppError(errorMessage, 400));
  }
  return next();
};


// --- Schemas for Individual Profile Data Objects ---

const planSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  duration: Joi.string().required(),
});

export const createGymProfileSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  photos: Joi.array().items(Joi.string().uri()).min(1).required(),
  facilities: Joi.array().items(Joi.string()).min(1).required(),
  plans: Joi.array().items(planSchema).min(1).required(),
});

export const createTrainerProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Trainer name cannot be empty.',
    'string.min': 'Trainer name must be at least 2 characters long.',
    'any.required': 'Trainer name is required.',
  }),
  bio: Joi.string().min(50).required(),
  experience: Joi.number().integer().min(0).required(),
  gallery: Joi.array().items(Joi.string().uri()).min(1).required(),
  plans: Joi.array().items(planSchema).min(1).required(),
});

export const createMerchantProfileSchema = Joi.object({
  storeName: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
});

export const createMemberProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    age: Joi.number().integer().min(13).max(100).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    weight: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
    healthConditions: Joi.string().allow('').optional(),
    fitnessGoal: Joi.string().allow('').optional(),
});


// --- Other Schemas ---
export const selectRoleSchema = Joi.object({
  role: Joi.string().uppercase().valid('MEMBER', 'GYM_OWNER', 'TRAINER', 'MERCHANT').required(),
});

// ... (schemas for signup, login, password reset, etc., can be here if you have them)

export default validate;