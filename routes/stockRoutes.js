const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth');

// GET  /api/stock/:productId  → riwayat stok produk (login)
router.get('/:productId', authenticate, stockController.getStockMovements);
// POST /api/stock/in          → stok masuk (login)
router.post('/in', authenticate, stockController.stockIn);
// POST /api/stock/out         → stok keluar (login)
router.post('/out', authenticate, stockController.stockOut);

module.exports = router;
