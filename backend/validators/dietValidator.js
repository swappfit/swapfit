import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Middleware for validating req.body
const validate = (schema) => (req, res, next) => {
    const options = {
        abortEarly: false,
        stripUnknown: true,
    };
    const { error, value } = schema.validate(req.body, options);
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join('; ');
        console.error("❌ Body Validation Failed:", errorMessages);
        return next(new AppError(errorMessages, 400));
    }
    req.body = value;
    return next();
};

// Middleware for validating req.params
export const validateParams = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join('; ');
        console.error("❌ Params Validation Failed:", errorMessages);
        return next(new AppError(errorMessages, 400));
    }
    return next();
};

const cuidSchema = Joi.string().length(25).required();

export const createLogSchema = Joi.object({
    mealName: Joi.string().required(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    calories: Joi.number().integer().min(0).required(),
    protein: Joi.number().integer().min(0).optional().allow(null),
    carbs: Joi.number().integer().min(0).optional().allow(null),
    fats: Joi.number().integer().min(0).optional().allow(null),
    fiber: Joi.number().integer().min(0).optional().allow(null),
    sugar: Joi.number().integer().min(0).optional().allow(null),
    photoUrl: Joi.string().uri().optional().allow(null, ''),
    notes: Joi.string().optional().allow(null, ''),
    createdAt: Joi.date().iso().optional(),
});

export const updateLogBodySchema = Joi.object({
    mealName: Joi.string().optional(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').optional(),
    calories: Joi.number().integer().min(0).optional(),
    protein: Joi.number().integer().min(0).optional().allow(null),
    carbs: Joi.number().integer().min(0).optional().allow(null),
    fats: Joi.number().integer().min(0).optional().allow(null),
    fiber: Joi.number().integer().min(0).optional().allow(null),
    sugar: Joi.number().integer().min(0).optional().allow(null),
    photoUrl: Joi.string().uri().optional().allow(null, ''),
    notes: Joi.string().optional().allow(null, ''),
    createdAt: Joi.date().iso().optional(),
});

// This is the exported name that the other file needs to use
export const dateParamSchema = Joi.object({
    date: Joi.string().isoDate().required(),
});

export const logIdParamSchema = Joi.object({
    logId: cuidSchema,
});

export default validate;
