// src/validators/bookingValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const createBookingCheckoutSchema = Joi.object({
  gymId: cuidSchema.label('Gym ID').required(),
  bookingType: Joi.string().valid('daily', 'weekly').required(),
});

export const gymIdParamSchema = Joi.object({
    gymId: cuidSchema.label('Gym ID').required(),
});

export const setPassPricesSchema = Joi.object({
    dailyPassPrice: Joi.number().min(0).optional().allow(null),
    weeklyPassPrice: Joi.number().min(0).optional().allow(null),
});

export default validate;

