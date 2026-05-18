const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

// GET  /api/transactions       → semua transaksi (login)
router.get('/', authenticate, transactionController.getTransactions);
// GET  /api/transactions/:id   → detail transaksi (login)
router.get('/:id', authenticate, transactionController.getTransactionById);
// POST /api/transactions       → buat transaksi baru (login — kasir/admin)
router.post('/', authenticate, transactionController.createTransaction);

// DELETE /api/transactions/:id    → hapus transaksi dan restore stok
router.delete('/:id', authenticate, transactionController.deleteTransaction);

module.exports = router;
