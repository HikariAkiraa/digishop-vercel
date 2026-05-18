const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// GET    /api/categories       → semua kategori (publik)
router.get('/', categoryController.getCategories);
// GET    /api/categories/:id   → detail kategori (publik)
router.get('/:id', categoryController.getCategoryById);
// POST   /api/categories       → tambah kategori (admin)
router.post('/', authenticate, authorizeAdmin, categoryController.createCategory);
// PUT    /api/categories/:id   → update kategori (admin)
router.put('/:id', authenticate, authorizeAdmin, categoryController.updateCategory);
// DELETE /api/categories/:id   → hapus kategori (admin)
router.delete('/:id', authenticate, authorizeAdmin, categoryController.deleteCategory);

module.exports = router;
