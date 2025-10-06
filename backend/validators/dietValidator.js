import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Middleware for validating req.body
const validate = (schema) => (req, res, next) => {
    const options = {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
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
    mealName: Joi.string().trim().min(1).max(100).required(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').default('breakfast'),
    calories: Joi.number().integer().min(0).max(10000).required(),
    protein: Joi.number().integer().min(0).max(1000).default(0),
    carbs: Joi.number().integer().min(0).max(1000).default(0),
    fats: Joi.number().integer().min(0).max(1000).default(0),
    fiber: Joi.number().integer().min(0).max(1000).optional().allow(null),
    sugar: Joi.number().integer().min(0).max(1000).optional().allow(null),
    photoUrl: Joi.string().uri().optional().allow(null, ''),
    notes: Joi.string().max(500).optional().allow(null, ''),
    createdAt: Joi.date().iso().optional(),
});

export const updateLogBodySchema = Joi.object({
    mealName: Joi.string().trim().min(1).max(100).optional(),
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').optional(),
    calories: Joi.number().integer().min(0).max(10000).optional(),
    protein: Joi.number().integer().min(0).max(1000).optional(),
    carbs: Joi.number().integer().min(0).max(1000).optional(),
    fats: Joi.number().integer().min(0).max(1000).optional(),
    fiber: Joi.number().integer().min(0).max(1000).optional().allow(null),
    sugar: Joi.number().integer().min(0).max(1000).optional().allow(null),
    photoUrl: Joi.string().uri().optional().allow(null, ''),
    notes: Joi.string().max(500).optional().allow(null, ''),
    createdAt: Joi.date().iso().optional(),
});

export const dateParamSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

export const logIdParamSchema = Joi.object({
    logId: Joi.string().required(),
});

export default validate;