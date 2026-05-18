const { authenticate } = require('../middleware/auth');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { getContacts, createContact, updateContact, uploadImage, deleteContact } = require('../controllers/contactController');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const minetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (minetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Hanya file gambar (JPEG/JPG/PNG/WEBP/GIF) yang diizinkan!'));
    }
});

const processContactImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `contact-${Date.now()}.webp`;
    const filepath = path.join(dir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 500, height: 500, fit: 'cover' }) // Square crop untuk foto profil contact
      .webp({ quality: 80 })
      .toFile(filepath);

    req.file.filename = filename;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses gambar', error: err.message });
  }
};

router.get('/', getContacts);
router.post('/', authenticate, createContact);
router.put('/:id', authenticate, updateContact);
router.put('/:id/image', authenticate, upload.single('image'), processContactImage, uploadImage);
router.delete('/:id', authenticate, deleteContact);

module.exports = router;
