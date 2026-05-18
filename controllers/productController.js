const ProductModel = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        const products = await ProductModel.getAllProducts();
        res.json({
            success: true,
            message: 'Daftar Semua Product DigiShop',
            data: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await ProductModel.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, message: 'Detail produk', data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, sku, description, cost_price, price, stock, category_id } = req.body;
        if (!name || !sku || price == null) {
            return res.status(400).json({ success: false, message: 'name, sku, dan price wajib diisi' });
        }
        const product = await ProductModel.createProduct({ name, sku, description, cost_price, price, stock, category_id });
        res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', data: product });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'SKU sudah digunakan' });
        }
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, sku, description, cost_price, price, stock, category_id } = req.body;
        if (!name || !sku || price == null) {
            return res.status(400).json({ success: false, message: 'name, sku, dan price wajib diisi' });
        }
        const product = await ProductModel.updateProduct(req.params.id, { name, sku, description, cost_price, price, stock, category_id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, message: 'Produk berhasil diupdate', data: product });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'SKU sudah digunakan' });
        }
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await ProductModel.deleteProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        
        if (product.image_url) {
            const oldImagePath = path.join(__dirname, '..', product.image_url);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        res.json({ success: true, message: 'Produk berhasil dihapus', data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const fs = require('fs');
const path = require('path');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file diunggah' });
        
        const db = require('../config/db');
        // Ambil data produk sebelumnya untuk mendapatkan url gambar lama
        const result = await db.query('SELECT image_url FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0 && result.rows[0].image_url) {
            const oldImagePath = path.join(__dirname, '..', result.rows[0].image_url);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const imageUrl = '/uploads/' + req.file.filename;
        await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, req.params.id]);
        res.json({ success: true, message: 'Gambar berhasil diupload', data: { image_url: imageUrl } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
}

module.exports = { getProducts, getProductById, createProduct, uploadImage, updateProduct, deleteProduct };