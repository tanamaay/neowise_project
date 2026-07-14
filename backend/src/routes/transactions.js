const express = require('express');
const transactionService = require('../services/transactionService');
const { authenticate, attachUser } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(attachUser);

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = parseInt(req.query.skip, 10) || 0;
    const transactions = await transactionService.getTransactionsForUser(req.userId, {
      limit,
      skip,
    });
    res.json({ transactions, balance: req.user.balance });
  } catch (err) {
    next(err);
  }
});

router.post('/transfer', async (req, res, next) => {
  try {
    const { toUserId, amount, description } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient user ID is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const transaction = await transactionService.transfer(
      req.userId,
      toUserId,
      parsedAmount,
      description
    );

    const updatedUser = await require('../repositories/userRepository').findById(req.userId);
    res.status(201).json({ transaction, balance: updatedUser.balance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/reverse', async (req, res, next) => {
  try {
    const transaction = await transactionService.reverseTransaction(req.params.id, req.userId);
    const updatedUser = await require('../repositories/userRepository').findById(req.userId);
    res.json({ transaction, balance: updatedUser.balance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
