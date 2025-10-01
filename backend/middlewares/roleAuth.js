// src/middlewares/roleAuth.js

import AppError from '../utils/AppError.js';

// This middleware factory checks if the user's role is included in the allowed roles.
// Example usage: roleAuth('ADMIN', 'GYM_OWNER')
const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role; // Assumes jwtAuth has run and set req.user
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new AppError('Forbidden: You do not have permission to perform this action.', 403));
    }
    next();
  };
};

export default roleAuth;