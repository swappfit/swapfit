// src/validators/cartValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const addToCartSchema = Joi.object({
  productId: cuidSchema.label('Product ID').required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const updateCartItemSchema = Joi.object({
  cartItemId: cuidSchema.label('Cart Item ID').required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const cartItemIdParamSchema = Joi.object({
  cartItemId: cuidSchema.label('Cart Item ID').required(),
});

export default validate;

