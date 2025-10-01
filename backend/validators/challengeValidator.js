// src/validators/challengeValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const challengeIdParamSchema = Joi.object({
  id: cuidSchema.label('Challenge ID'),
});

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
});

export const createChallengeSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  metric: Joi.string().valid('steps', 'workouts').required(),
  goal: Joi.number().integer().positive().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
});

export default validate;

