// src/validators/subscriptionValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  }
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const createCheckoutSchema = Joi.object({
  planId: cuidSchema.label('Plan ID').required(),
});

export const cancelSubscriptionSchema = Joi.object({
  subscriptionId: cuidSchema.label('Subscription ID').required(),
});

export default validate;

