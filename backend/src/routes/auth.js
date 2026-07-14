const express = require('express');
const { login, register } = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const { authenticate, attachUser } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const result = await register(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authenticate, attachUser, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await userRepository.findAll();
    const filtered = users
      .filter((u) => u.id !== req.userId)
      .map(({ id, name, email }) => ({ id, name, email }));
    res.json({ users: filtered });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
