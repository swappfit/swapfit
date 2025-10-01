// src/validators/trainingValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  }
  return next();
};

const cuidSchema = Joi.string().length(25).required();

// Schema for a single exercise within the log
const exerciseSchema = Joi.object({
  name: Joi.string().required(),
  sets: Joi.number().integer().min(1).required(),
  reps: Joi.number().integer().min(1).required(),
  weight: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().optional().allow(null, ''),
});

export const createLogSchema = Joi.object({
  workoutName: Joi.string().required(),
  workoutType: Joi.string().required(),
  date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(1).required(),
  intensity: Joi.string().valid('low', 'medium', 'high').required(),
  muscleGroups: Joi.array().items(Joi.string()).optional(),
  equipment: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(null, ''),
  exercises: Joi.array().items(exerciseSchema).min(1).required(),
});

export const updateLogSchema = Joi.object({
  logId: cuidSchema, // from params
  // All fields are optional on update
  workoutName: Joi.string(),
  workoutType: Joi.string(),
  date: Joi.date().iso(),
  duration: Joi.number().integer().min(1),
  intensity: Joi.string().valid('low', 'medium', 'high'),
  muscleGroups: Joi.array().items(Joi.string()),
  equipment: Joi.array().items(Joi.string()),
  notes: Joi.string().allow(null, ''),
  // Updating nested exercises is complex; we'll handle session-level updates for now.
});

export const getLogsByDateSchema = Joi.object({
  date: Joi.string().isoDate().required(),
});

export const logIdParamSchema = Joi.object({
    logId: cuidSchema,
});

export default validate;