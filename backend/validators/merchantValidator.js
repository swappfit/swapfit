// On your BACKEND in src/validators/merchantValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(), // Expecting an array of URLs
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

export const productIdParamSchema = Joi.object({
    productId: cuidSchema.label('Product ID'),
});

export default validate;