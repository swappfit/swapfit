// src/utils/catchAsync.js

/**
 * A wrapper for async Express route handlers to catch errors and pass them to the global error handler.
 * @param {function} fn - The async controller function to wrap.
 * @returns {function} An Express middleware function.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Pass any caught error to next()
  };
};

export default catchAsync;

