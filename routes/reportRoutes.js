const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// GET /api/reports/sales?start=2026-03-01&end=2026-03-31  → laporan per periode
router.get('/sales', authenticate, authorizeAdmin, reportController.getSalesReport);
// GET /api/reports/top-products?limit=10                   → produk terlaris
router.get('/top-products', authenticate, authorizeAdmin, reportController.getTopProducts);
// GET /api/reports/daily?days=30                            → ringkasan harian
router.get('/daily', authenticate, authorizeAdmin, reportController.getDailySales);
// GET /api/reports/categories                               → penjualan per kategori
router.get('/categories', authenticate, authorizeAdmin, reportController.getSalesByCategory);

module.exports = router;
