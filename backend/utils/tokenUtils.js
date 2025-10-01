// src/utils/tokenUtils.js

import jwt from 'jsonwebtoken';

export const generateInternalToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};