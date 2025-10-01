// File: middlewares/adminAuth.js

const adminAuth = (req, res, next) => {
  // This middleware should run AFTER your standard jwtAuth middleware.
  // jwtAuth will add the `user` object to the `req`.
  
  if (req.user && req.user.role === 'ADMIN') {
    // If the user exists and their role is 'ADMIN', proceed.
    next();
  } else {
    // Otherwise, deny access.
    res.status(403).json({ success: false, message: 'Forbidden: Access is restricted to administrators.' });
  }
};

export default adminAuth;