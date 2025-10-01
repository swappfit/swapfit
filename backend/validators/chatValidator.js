// src/validators/chatValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

const cuidSchema = Joi.string().length(25).required();

export const startConversationSchema = Joi.object({
  recipientId: cuidSchema.label('Recipient User ID').required(),
});

export const conversationIdParamSchema = Joi.object({
  conversationId: cuidSchema.label('Conversation ID').required(),
});

export default validate;

