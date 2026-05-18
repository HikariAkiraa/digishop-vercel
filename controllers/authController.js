const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

const register = async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'name, email, dan password wajib diisi' });
        }

        const existingUser = await AuthModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await AuthModel.createUser({ name, email, password_hash, role_id: role_id || 2 });

        res.status(201).json({ success: true, message: 'User berhasil didaftarkan', data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
        }

        const user = await AuthModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};



const updateProfile = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await AuthModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password lama salah' });
        }

        if (email !== user.email) {
            const existingEmailUser = await AuthModel.findByEmail(email);
            if (existingEmailUser && existingEmailUser.id !== userId) {
                 return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
            }
        }

        const password_hash = newPassword ? await bcrypt.hash(newPassword, 10) : user.password_hash;
        
        const updatedUser = await AuthModel.updateProfile(userId, email, password_hash);

        res.json({ success: true, message: 'Profil berhasil diperbarui', data: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

module.exports = { register, login, updateProfile };
