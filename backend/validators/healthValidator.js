// src/validators/healthValidator.js
import Joi from 'joi';
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join('; '), 400));
  }
  return next();
};

// Define schemas for each individual data point type
const stepPointSchema = Joi.object({
  date: Joi.date().iso().required(),
  value: Joi.number().integer().min(0).required(),
});

const sleepPointSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required().greater(Joi.ref('startDate')),
});

const heartRatePointSchema = Joi.object({
  timestamp: Joi.date().iso().required(),
  value: Joi.number().integer().positive().required(),
});

// Main schema for the /sync endpoint body
export const syncDataSchema = Joi.object({
  source: Joi.string().required(),
  // Use `when` to conditionally validate the `data` array based on `dataType`
  dataType: Joi.string().valid('steps', 'sleep', 'heart_rate').required(),
  data: Joi.array().min(1).when('dataType', {
    is: 'steps',
    then: Joi.array().items(stepPointSchema).required(),
  }).when('dataType', {
    is: 'sleep',
    then: Joi.array().items(sleepPointSchema).required(),
  }).when('dataType', {
      is: 'heart_rate',
      then: Joi.array().items(heartRatePointSchema).required(),
  }),
});


export default validate;

