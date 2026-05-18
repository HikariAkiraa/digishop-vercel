const ReportModel = require('../models/reportModel');

const getSalesReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'Parameter start dan end wajib diisi (format: YYYY-MM-DD)' });
        }

        const summary = await ReportModel.getSalesByPeriod(start, end);
        const transactions = await ReportModel.getTransactionsByPeriod(start, end);

        res.json({
            success: true,
            message: `Laporan penjualan ${start} s/d ${end}`,
            data: { summary, transactions }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await ReportModel.getTopProducts(limit);
        res.json({ success: true, message: `Top ${limit} produk terlaris`, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getDailySales = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const sales = await ReportModel.getDailySales(days);
        res.json({ success: true, message: `Penjualan harian (${days} hari terakhir)`, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const getSalesByCategory = async (req, res) => {
    try {
        const sales = await ReportModel.getSalesByCategory();
        res.json({ success: true, message: 'Penjualan per kategori', data: sales });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

module.exports = { getSalesReport, getTopProducts, getDailySales, getSalesByCategory };
