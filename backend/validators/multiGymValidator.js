// src/validators/multiGymValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

// --- Member Schemas ---
export const nearbyGymsSchema = Joi.object({
  lat: Joi.number().required(),
  lon: Joi.number().required(),
  radius: Joi.number().positive().default(15),
});

// --- Admin Schemas ---
export const createTierSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  chargebeePlanId: Joi.string().optional().allow(null, ''),
});

export const updateTierSchema = Joi.object({
    name: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    chargebeePlanId: Joi.string().optional().allow(null, ''),
}).min(1);

export const tierIdParamSchema = Joi.object({
    tierId: cuidSchema.label('Tier ID'),
});

export const assignGymSchema = Joi.object({
    tierId: cuidSchema.label('Tier ID').required(),
    gymId: cuidSchema.label('Gym ID').required(),
});

export default validate;

