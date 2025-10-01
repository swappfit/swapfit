// src/validators/productValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params, ...req.query });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

// --- Schemas for Admin Product Management ---
export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  category: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
}).min(1);

// --- Schemas for Public/Member Actions ---
export const productIdParamSchema = Joi.object({
    id: cuidSchema.label('Product ID'),
});

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(12),
});

export default validate;
