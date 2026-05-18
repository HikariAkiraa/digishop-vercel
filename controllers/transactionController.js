const TransactionModel = require('../models/transactionModel');

const getTransactions = async (req, res) => {
    try {
        const transactions = await TransactionModel.getAllTransactions();
        res.json({ success: true, message: 'Daftar semua transaksi', data: transactions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const transaction = await TransactionModel.getTransactionById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }
        res.json({ success: true, message: 'Detail transaksi', data: transaction });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const createTransaction = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items wajib diisi (array of { product_id, quantity })' });
        }

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ success: false, message: 'Setiap item harus punya product_id dan quantity (> 0)' });
            }
        }

        const transaction = await TransactionModel.createTransaction({ user_id: req.user.id, items });
        res.status(201).json({ success: true, message: 'Transaksi berhasil dibuat', data: transaction });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        await TransactionModel.deleteTransaction(req.params.id, req.user.id);
        res.json({ success: true, message: 'Transaksi berhasil dihapus dan stok dikembalikan' });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

module.exports = { getTransactions, getTransactionById, createTransaction, deleteTransaction };
