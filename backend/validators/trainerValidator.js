// src/validators/trainerValidator.js

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

const cuidSchema = Joi.string().length(25).required();

// --- Schemas ---

export const browseTrainersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

export const trainerIdParamSchema = Joi.object({
  id: cuidSchema.label('Trainer User ID'),
});

export const updateProfileSchema = Joi.object({
  bio: Joi.string().optional(),
  experience: Joi.number().integer().min(0).optional(),
  gallery: Joi.array().items(Joi.string().uri()).optional(),
});

export const createTrainingPlanSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  duration: Joi.number().integer().positive().required(),
  workoutsJson: Joi.object().required(), // Ensure it's a valid JSON object
});

export const updateTrainingPlanSchema = Joi.object({
    planId: cuidSchema.required(),
    name: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    duration: Joi.number().integer().positive().optional(),
    workoutsJson: Joi.object().optional(),
});

export const assignPlanSchema = Joi.object({
  planId: cuidSchema.required(),
  memberId: cuidSchema.required(),
});

export const planIdParamSchema = Joi.object({
    planId: cuidSchema.required(),
});

export const updateTrialSchema = Joi.object({
    planId: cuidSchema.required(),
    trialEnabled: Joi.boolean().required(),
    trialDurationDays: Joi.number().integer().positive().when('trialEnabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional().allow(null)
    }),
});

export default validate;

