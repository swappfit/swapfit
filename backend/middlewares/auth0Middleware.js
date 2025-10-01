import { auth } from 'express-oauth2-jwt-bearer';

/**
 * Correctly configured Auth0 middleware instance.
 * This is used by the gatekeeper and the /verify-user route.
 */
export const auth0Middleware = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://api.fitnessclub.com',
  issuerBaseURL: process.env.AUTH0_ISSUER_URL || 'https://dev-1de0bowjvfbbcx7q.us.auth0.com/',
  tokenSigningAlg: 'RS256', // <-- THE FIX IS HERE
});
