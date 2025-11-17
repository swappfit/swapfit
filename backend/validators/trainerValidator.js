import Joi from 'joi';
import AppError from '../utils/AppError.js';

// ✅ UPDATED VALIDATION MIDDLEWARE ✅
const validate = (schema, source = 'body') => (req, res, next) => {
  let dataToValidate = {};

  // ✅ ONLY validate the relevant part of the request
  if (source === 'body') {
    dataToValidate = req.body;
  } else if (source === 'params') {
    dataToValidate = req.params;
  } else if (source === 'query') {
    dataToValidate = req.query;
  }

  const { error } = schema.validate(dataToValidate, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    return next(new AppError(errorMessage, 400));
  }
  return next();
};


// --- Schemas ---

export const browseTrainersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

export const trainerIdParamSchema = Joi.object({
  id: Joi.string().length(25).required().label('Trainer User ID'), // ✅ Added a label for a clearer error message
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
  workoutsJson: Joi.object().required(),
});

export const updateTrainingPlanSchema = Joi.object({
    planId: Joi.string().length(25).required(),
    name: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    duration: Joi.number().integer().positive().optional(),
    workoutsJson: Joi.object().optional(),
});

export const assignPlanSchema = Joi.object({
  planId: Joi.string().length(25).required(),
  memberId: Joi.string().length(25).required(),
});

export const planIdParamSchema = Joi.object({
    planId: Joi.string().length(25).required(),
});

export const updateTrialSchema = Joi.object({
    planId: Joi.string().length(25).required(),
    trialEnabled: Joi.boolean().required(),
    trialDurationDays: Joi.number().integer().positive().when('trialEnabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional().allow(null)
    }),
});

export default validate;