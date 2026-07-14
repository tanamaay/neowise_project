const jwt = require('jsonwebtoken');
const { verifyToken } = require('../services/authService');
const userRepository = require('../repositories/userRepository');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function attachUser(req, res, next) {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, attachUser };
