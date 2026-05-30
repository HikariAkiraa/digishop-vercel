const { authenticate } = require('../middleware/auth');
const express = require('express');
const multer = require('multer');
const path = require('path');
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

router.get('/', getContacts);
router.post('/', authenticate, createContact);
router.put('/:id', authenticate, updateContact);
router.put('/:id/image', authenticate, upload.single('image'), uploadImage);
router.delete('/:id', authenticate, deleteContact);

module.exports = router;
