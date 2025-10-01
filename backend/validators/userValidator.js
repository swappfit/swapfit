
// src/validators/userValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  return next();
};

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Schema for updating the MemberProfile
export const updateMemberProfileSchema = Joi.object({
  age: Joi.number().integer().min(13).max(100).optional(),
  gender: Joi.string().optional(),
  weight: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  healthConditions: Joi.string().allow('').optional(),
  fitnessGoal: Joi.string().allow('').optional(),
}).min(1); // Require at least one field to be updated

// Schema for updating the TrainerProfile
export const updateTrainerProfileSchema = Joi.object({
    bio: Joi.string().optional(),
    experience: Joi.number().integer().min(0).optional(),
    gallery: Joi.array().items(Joi.string().uri()).optional(),
}).min(1);

// Schema for updating the Gym profile (subset of fields an owner can change)
export const updateGymProfileSchema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    photos: Joi.array().items(Joi.string().uri()).optional(),
    facilities: Joi.array().items(Joi.string()).optional(),
}).min(1);

export default validate;

