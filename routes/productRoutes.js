const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Gunakan memory storage agar file tidak langsung ditulis ke disk
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // limit 5MB

// Middleware kompresi gambar WebP
const processImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `prod-${Date.now()}.webp`;
    const filepath = path.join(dir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true }) // Resize maksimal width 800px
      .webp({ quality: 80 }) // Kompres menjadi webp quality 80
      .toFile(filepath);

    req.file.filename = filename; // overwrite filename untuk controller
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses gambar', error: err.message });
  }
};

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

// New image upload route
router.put('/:id/image', authenticate, upload.single('image'), processImage, productController.uploadImage);

module.exports = router;
