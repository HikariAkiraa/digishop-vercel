const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register → daftar user baru
router.post('/register', authController.register);
// POST /api/auth/login    → login → dapat JWT token
router.post('/login', authController.login);

module.exports = router;

const { authenticate } = require('../middleware/auth');
router.put('/profile', authenticate, authController.updateProfile);
