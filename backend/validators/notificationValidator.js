// validators/notificationValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate({ ...req.body, ...req.params });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

<<<<<<< HEAD
// --- Existing Schemas ---
=======
>>>>>>> a3fb6ebb785b50067eea3d6dfee2cccd2bd93a19
export const registerTokenSchema = Joi.object({
    token: Joi.string().required(),
});

export const sendGymNotificationSchema = Joi.object({
    title: Joi.string().required(),
    message: Joi.string().required(),
});

export const notificationIdParamSchema = Joi.object({
    id: Joi.string().required(),
});

<<<<<<< HEAD

// --- New Admin Schemas ---

// Schema for sending a notification to all users
export const sendToAllSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Title cannot be empty.',
        'any.required': 'Title is required.',
    }),
    message: Joi.string().required().messages({
        'string.empty': 'Message cannot be empty.',
        'any.required': 'Message is required.',
    }),
});

// Schema for sending a notification to a specific role
export const sendToRoleSchema = Joi.object({
    role: Joi.string().valid('MEMBER', 'GYM_OWNER', 'TRAINER', 'MERCHANT', 'ADMIN').required().messages({
        'any.only': 'Role must be one of: MEMBER, GYM_OWNER, TRAINER, MERCHANT, ADMIN.',
        'any.required': 'Role is required.',
    }),
    title: Joi.string().required(),
    message: Joi.string().required(),
});

// Schema for sending a notification to a specific user by their database ID
export const sendToUserSchema = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'User ID cannot be empty.',
        'any.required': 'User ID is required.',
    }),
    title: Joi.string().required(),
    message: Joi.string().required(),
});

// Schema for sending a notification to all members of a specific gym
export const sendToGymSchema = Joi.object({
    gymId: Joi.string().required().messages({
        'string.empty': 'Gym ID cannot be empty.',
        'any.required': 'Gym ID is required.',
    }),
    title: Joi.string().required(),
    message: Joi.string().required(),
});


=======
>>>>>>> a3fb6ebb785b50067eea3d6dfee2cccd2bd93a19
export default validate;