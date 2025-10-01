// src/middlewares/errorHandler.js
import AppError from '../utils/AppError.js';

// --- Specific Error Handlers ---

// Handles Prisma's 'Record Not Found' error
const handleNotFoundError = () => new AppError('The requested record was not found.', 404);

// Handles Prisma's 'Unique Constraint Violation' error
const handleUniqueConstraintError = (err) => {
  // Example: Extract the field from the error meta data
  const field = err.meta?.target?.join(', ');
  const message = `A record with this ${field || 'value'} already exists.`;
  return new AppError(message, 409); // 409 Conflict
};

// --- Response Functions for Different Environments ---

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack, // Include stack trace in development
  });
};

const sendErrorProd = (err, res) => {
  // For operational errors we trust, send a clean message to the client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  
  // For programming or unknown errors, log them and send a generic message
  console.error('💥 UNEXPECTED ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong on our end. Please try again later.',
  });
};


// --- The Main Global Error Handling Middleware ---

const globalErrorHandler = (err, req, res, next) => {
  // Set default status and code if they are not already defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };

    // Handle specific Prisma errors for cleaner production messages
    if (error.code === 'P2025') error = handleNotFoundError();
    if (error.code === 'P2002') error = handleUniqueConstraintError(error);

    // Add handlers for JWT errors, validation errors, etc. here

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;