// src/middlewares/authGatekeeper.js

import jwt from 'jsonwebtoken';
import { auth0Middleware } from './auth0Middleware.js';
import AppError from '../utils/AppError.js';

const authGatekeeper = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is missing or malformed.', 401));
  }

  const token = authHeader.split(' ')[1];

  // --- Step 1: Try to verify as an Internal JWT (for Web Client) ---
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`[Gatekeeper] SUCCESS: Authenticated via Internal JWT for User ID: ${req.user.id}`);
    return next(); // SUCCESS for Web Client, exit.
  } catch (err) {
    // This is the expected path for the Mobile Client.
    console.log('[Gatekeeper] Internal JWT check failed. Assuming Auth0 token and proceeding to verify...');
  }

  // --- Step 2: Try to verify as an Auth0 Token (for Mobile Client) ---
  try {
    // This wrapper correctly handles the async and error-callback nature of the Auth0 middleware.
    await new Promise((resolve, reject) => {
      auth0Middleware(req, res, (err) => {
        if (err) {
          // If the auth0 middleware finds an error, it calls this, and we reject.
          return reject(err);
        }
        // If it succeeds, it populates req.auth and we resolve.
        resolve();
      });
    });

    // If the promise resolved, Auth0 validation was successful.
    console.log(`[Gatekeeper] SUCCESS: Authenticated via Auth0 Token for sub: ${req.auth.payload.sub}`);
    return next(); // SUCCESS for Mobile Client, exit.

  } catch (error) {
    // If the promise was rejected, Auth0 validation failed. This is the fix for the silent error.
    console.error('[Gatekeeper] FATAL: Auth0 token validation failed.', error.message);
    return next(new AppError('Invalid token. Authentication failed.', 401));
  }
};

export default authGatekeeper;