// src/middlewares/jwtAuth.js
import jwt from 'jsonwebtoken';

const jwtAuth = (req, res, next) => {
  console.log('[jwtAuth] Middleware running...');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[jwtAuth] FAILED: No Bearer token provided.');
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log(`[jwtAuth] Found token: ${token.slice(0, 15)}...`);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[jwtAuth] SUCCESS: Token verified. Decoded payload:', decoded);
    req.user = decoded; // Attach payload to the request
    next(); // Pass control to the next middleware (the validator)
  } catch (err) {
    console.error('[jwtAuth] FAILED: Token verification error.', err.message);
    // It's better to send a proper error response than to let it hang
    return res.status(401).json({ success: false, message: `Unauthorized: ${err.message}` });
  }
};

export default jwtAuth;