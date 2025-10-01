import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.query, ...req.params });
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  }
  return next();
};

const cuidSchema = Joi.string().length(25).required();

const workoutLogSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    equipment: Joi.array().items(Joi.string()).required(),
    difficulty: Joi.string().required(),
});

export const logSessionSchema = Joi.object({
  date: Joi.date().iso().optional(),
  workoutName: Joi.string().required(),
  workoutType: Joi.string().optional().allow('', null),
  duration: Joi.number().integer().min(0).optional().allow(null),
  intensity: Joi.string().valid('low', 'medium', 'high').optional().allow(null),
  notes: Joi.string().optional().allow('', null),
  muscleGroups: Joi.array().items(Joi.string()).optional().allow(null),
  equipment: Joi.array().items(Joi.string()).optional().allow(null),
  exercises: Joi.array().items(workoutLogSchema).min(1).required(),
});

export const getHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

export const sessionIdParamSchema = Joi.object({
    sessionId: cuidSchema.required(),
});

export const deleteExerciseSchema = Joi.object({
    sessionId: cuidSchema.required(),
    exerciseId: Joi.string().required(),
});

export default validate;