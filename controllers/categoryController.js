const CategoryModel = require('../models/categoryModel');

const getCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.getAllCategories();
        res.json({ success: true, message: 'Daftar semua kategori', data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await CategoryModel.getCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
        }
        res.json({ success: true, message: 'Detail kategori', data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
        }
        const category = await CategoryModel.createCategory({ name, description });
        res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: category });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
        }
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
        }
        const category = await CategoryModel.updateCategory(req.params.id, { name, description });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
        }
        res.json({ success: true, message: 'Kategori berhasil diupdate', data: category });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
        }
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await CategoryModel.deleteCategory(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
        }
        res.json({ success: true, message: 'Kategori berhasil dihapus', data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
