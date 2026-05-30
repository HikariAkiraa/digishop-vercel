const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

// Gunakan memory storage agar file tidak langsung ditulis ke disk
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // limit 5MB

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

// New image upload route using direct memory storage
router.put('/:id/image', authenticate, upload.single('image'), productController.uploadImage);

module.exports = router;
