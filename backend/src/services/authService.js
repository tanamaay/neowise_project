const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

async function login(email, password) {
  const emailHash = userRepository.hashForLookup(email);
  const user = await require('../config/db').getDB().collection('users').findOne({ emailHash });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const decrypted = userRepository.decryptUser(user);
  const token = generateToken(decrypted.id);

  return { user: decrypted, token };
}

async function register(name, email, password) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const user = await userRepository.create({ name, email, password });
  const token = generateToken(user.id);
  return { user, token };
}

module.exports = { generateToken, verifyToken, login, register };
