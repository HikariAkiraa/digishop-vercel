const StockModel = require('../models/stockModel');

const getStockMovements = async (req, res) => {
    try {
        const movements = await StockModel.getMovementsByProduct(req.params.productId);
        res.json({ success: true, message: 'Riwayat pergerakan stok', data: movements });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const stockIn = async (req, res) => {
    try {
        const { product_id, quantity, note } = req.body;
        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'product_id dan quantity (> 0) wajib diisi' });
        }
        const movement = await StockModel.addStock({ product_id, quantity, note, user_id: req.user.id });
        res.status(201).json({ success: true, message: 'Stok masuk berhasil dicatat', data: movement });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const stockOut = async (req, res) => {
    try {
        const { product_id, quantity, note } = req.body;
        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'product_id dan quantity (> 0) wajib diisi' });
        }
        const movement = await StockModel.reduceStock({ product_id, quantity, note, user_id: req.user.id });
        res.status(201).json({ success: true, message: 'Stok keluar berhasil dicatat', data: movement });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

module.exports = { getStockMovements, stockIn, stockOut };
