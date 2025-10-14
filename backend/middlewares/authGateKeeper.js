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
// // src/middlewares/authGatekeeper.js

// import jwt from 'jsonwebtoken';
// import { auth0Middleware } from './auth0Middleware.js';
// import { PrismaClient } from '@prisma/client';
// import AppError from '../utils/AppError.js';

// const prisma = new PrismaClient();

// const authGatekeeper = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return next(new AppError('Authentication token is missing or malformed.', 401));
//   }

//   const token = authHeader.split(' ')[1];

//   // --- Step 1: Try to verify as an Internal JWT (for Web Client) ---
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     console.log(`[Gatekeeper] SUCCESS: Authenticated via Internal JWT for User ID: ${req.user.id}`);
//     return next(); // SUCCESS for Web Client, exit.
//   } catch (err) {
//     // This is the expected path for the Mobile Client.
//     console.log('[Gatekeeper] Internal JWT check failed. Assuming Auth0 token and proceeding to verify...');
//   }

//   // --- Step 2: Try to verify as an Auth0 Token (for Mobile Client) ---
//   try {
//     // This wrapper correctly handles the async and error-callback nature of the Auth0 middleware.
//     await new Promise((resolve, reject) => {
//       auth0Middleware(req, res, (err) => {
//         if (err) {
//           // If the auth0 middleware finds an error, it calls this, and we reject.
//           return reject(err);
//         }
//         // If it succeeds, it populates req.auth and we resolve.
//         resolve();
//       });
//     });

//     // If the promise resolved, Auth0 validation was successful.
//     console.log(`[Gatekeeper] SUCCESS: Authenticated via Auth0 Token for sub: ${req.auth.payload.sub}`);
    
//     // --- Step 3: Fetch user from database using Auth0 sub ---
//     try {
//       const auth0Id = req.auth.payload.sub;
//       console.log(`[Gatekeeper] Looking for user with auth0_id: ${auth0Id}`);
      
//       let user = await prisma.user.findUnique({
//         where: { auth0_id: auth0Id }, // Fixed: Use auth0_id instead of auth0Id
//         select: { id: true, email: true, role: true }
//       });
      
//       if (!user) {
//         console.log(`[Gatekeeper] User not found in database for auth0_id: ${auth0Id}. Creating new user...`);
        
//         // Create a new user if not found
//         user = await prisma.user.create({
//           data: {
//             auth0_id: auth0Id, // Fixed: Use auth0_id instead of auth0Id
//             email: req.auth.payload.email || `${auth0Id}@example.com`,
//             role: 'USER' // Default role
//           },
//           select: { id: true, email: true, role: true }
//         });
        
//         console.log(`[Gatekeeper] New user created:`, user);
//       } else {
//         console.log(`[Gatekeeper] User found in database:`, user);
//       }
      
//       // Attach the user to the request
//       req.user = user;
//       console.log(`[Gatekeeper] User attached to request:`, req.user);
      
//       return next(); // SUCCESS for Mobile Client, exit.
//     } catch (dbError) {
//       console.error('[Gatekeeper] Database error:', dbError);
//       return next(new AppError('Failed to authenticate user', 500));
//     }
//   } catch (error) {
//     // If the promise was rejected, Auth0 validation failed. This is the fix for the silent error.
//     console.error('[Gatekeeper] FATAL: Auth0 token validation failed.', error.message);
//     return next(new AppError('Invalid token. Authentication failed.', 401));
//   }
// };
 
// export default authGatekeeper;