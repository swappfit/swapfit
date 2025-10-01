import Joi from 'joi';
import AppError from '../utils/AppError.js';

// ✅ FIXED: A specific validator just for the request body (req.body)
export const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    console.error('❌ Joi Body Validation Error:', errorMessage);
    return next(new AppError(errorMessage, 400));
  }
  return next();
};

// ✅ FIXED: A specific validator just for URL parameters (req.params)
export const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params);
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    console.error('❌ Joi Params Validation Error:', errorMessage);
    return next(new AppError(errorMessage, 400));
  }
  return next();
};

// ✅ FIXED: A specific validator just for query strings (req.query)
export const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query);
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join('; ');
    console.error('❌ Joi Query Validation Error:', errorMessage);
    return next(new AppError(errorMessage, 400));
  }
  return next();
};


// --- Schemas remain the same ---

const cuidSchema = Joi.string().length(25).required();

export const postContentSchema = Joi.object({
  content: Joi.string().trim().min(1).required(),
  imageUrl: Joi.string().uri().required().label('Image URL'),
});

export const commentContentSchema = Joi.object({
  content: Joi.string().trim().min(1).required(),
});

export const postIdParamSchema = Joi.object({
  postId: cuidSchema.label('Post ID'),
});

export const commentIdParamSchema = Joi.object({
  commentId: cuidSchema.label('Comment ID'),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});