// src/utils/AppError.js

/**
 * A standardized, operational error class.
 * @param {string} message - The error message for the client.
 * @param {number} statusCode - The HTTP status code (e.g., 400, 404).
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // isOperational distinguishes our trusted errors from unknown programming errors.
    this.isOperational = true;

    // Preserve the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

