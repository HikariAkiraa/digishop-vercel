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

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAndFilename = parts[1].replace(/^v\d+\//, ''); // hapus format versi (contoh: v12345/)
    const lastDotIndex = pathAndFilename.lastIndexOf('.');
    return lastDotIndex === -1 ? pathAndFilename : pathAndFilename.substring(0, lastDotIndex);
};

const deleteFromCloudinary = async (url) => {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Gagal menghapus gambar lama dari Cloudinary:', err.message);
        }
    }
};

const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'webp' }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

const deleteProduct = async (req, res) => {
    try {
        const product = await ProductModel.deleteProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        
        if (product.image_url) {
            await deleteFromCloudinary(product.image_url);
        }
        
        res.json({ success: true, message: 'Produk berhasil dihapus', data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file diunggah' });
        
        const db = require('../config/db');
        // Ambil data produk sebelumnya untuk mendapatkan url gambar lama
        const result = await db.query('SELECT image_url FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0 && result.rows[0].image_url) {
            await deleteFromCloudinary(result.rows[0].image_url);
        }

        const folder = 'digishop/products';
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, folder);
        const imageUrl = cloudinaryResult.secure_url;

        await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, req.params.id]);
        res.json({ success: true, message: 'Gambar berhasil diupload', data: { image_url: imageUrl } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
}

module.exports = { getProducts, getProductById, createProduct, uploadImage, updateProduct, deleteProduct };