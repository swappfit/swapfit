// src/utils/parseApiError.js

/**
 * Safely extracts a user-friendly error message from an API error object (like from Axios).
 * @param {object} error - The error object caught in a try...catch block.
 * @returns {string} A user-friendly error message.
 */
const parseApiError = (error) => {
  // 1. Prioritize the specific message from our backend's JSON response
  if (error.response && error.response.data && typeof error.response.data.message === 'string') {
    return error.response.data.message;
  }

  // 2. Handle cases where the data might be a stringified JSON
  if (error.response && error.response.data && typeof error.response.data === 'string') {
      try {
          const parsed = JSON.parse(error.response.data);
          if (parsed.message) return parsed.message;
      } catch (e) {
          // Not a JSON string, fall through
      }
  }
  
  // 3. Use the general error message if available
  if (error.message) {
    return error.message;
  }

  // 4. A final, generic fallback
  return 'An unexpected error occurred. Please try again.';
};

export default parseApiError;