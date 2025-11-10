import Joi from 'joi';

// Common schemas
const idSchema = Joi.string().uuid().required();
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Gym Management Schemas
export const updateGymStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
});

export const updateGymBadgesSchema = Joi.object({
  badges: Joi.array().items(Joi.string()).required(),
});

export const assignGymToTierSchema = Joi.object({
  tierName: Joi.string().valid('Silver', 'Gold', 'Platinum').required(),
});

// Challenge Schemas
export const createChallengeSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  rewards: Joi.array().items(Joi.string()).required(),
});

export const updateChallengeSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().min(10).max(500),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  rewards: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'completed', 'cancelled'),
});

export const challengeIdParamSchema = Joi.object({
  challengeId: idSchema,
});

// Notification Schema
export const broadcastNotificationSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  message: Joi.string().min(10).max(500).required(),
});

// User Management Schema
export const getUsersSchema = paginationSchema.keys({
  role: Joi.string().valid('MEMBER', 'TRAINER', 'GYM_OWNER', 'ADMIN'),
});

// Subscription Management Schema
export const subscriptionIdParamSchema = Joi.object({
  subscriptionId: idSchema,
});

// Export a validation middleware factory
export default function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      });
    }

    req.body = value;
    next();
  };
}