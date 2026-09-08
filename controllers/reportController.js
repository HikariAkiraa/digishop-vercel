const ReportModel = require('../models/reportModel');
const CashFlowModel = require('../models/cashFlowModel');

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

// Cash Flow Controller
const getCashFlowReport = async (req, res) => {
    try {
        const filter = req.query.filter || 'quartal'; // 'quartal' | 'year' | 'all' | 'custom'
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1 - 12
        const currentQuarter = Math.ceil(currentMonth / 3); // 1 - 4

        let startDate = '';
        let endDate = '';
        let label = '';
        let groupBy = 'month';

        const year = parseInt(req.query.year, 10) || currentYear;
        const quarter = parseInt(req.query.quarter, 10) || currentQuarter;

        if (filter === 'quartal') {
            const quarterMap = {
                1: { start: `${year}-01-01`, end: `${year}-03-31`, label: `Q1 ${year} (Jan - Mar)` },
                2: { start: `${year}-04-01`, end: `${year}-06-30`, label: `Q2 ${year} (Apr - Jun)` },
                3: { start: `${year}-07-01`, end: `${year}-09-30`, label: `Q3 ${year} (Jul - Sep)` },
                4: { start: `${year}-10-01`, end: `${year}-12-31`, label: `Q4 ${year} (Okt - Des)` },
            };
            const selectedQ = quarterMap[quarter] || quarterMap[1];
            startDate = selectedQ.start;
            endDate = selectedQ.end;
            label = selectedQ.label;
            groupBy = 'month';
        } else if (filter === 'year') {
            startDate = `${year}-01-01`;
            endDate = `${year}-12-31`;
            label = `Tahun ${year} (Jan - Des)`;
            groupBy = 'month';
        } else if (filter === 'all') {
            startDate = '2020-01-01';
            endDate = `${currentYear + 1}-12-31`;
            label = 'Semua Waktu (All Time)';
            groupBy = 'year';
        } else if (filter === 'custom') {
            startDate = req.query.start || `${currentYear}-01-01`;
            endDate = req.query.end || `${currentYear}-12-31`;
            label = `${startDate} s/d ${endDate}`;
            groupBy = 'month';
        }

        const [summary, chart_data, ledger] = await Promise.all([
            CashFlowModel.getCashFlowSummary(startDate, endDate),
            CashFlowModel.getCashFlowChart(startDate, endDate, groupBy),
            CashFlowModel.getCashFlowLedger(startDate, endDate)
        ]);

        res.json({
            success: true,
            message: `Laporan arus kas (${label})`,
            data: {
                period_info: {
                    filter,
                    year,
                    quarter,
                    start_date: startDate,
                    end_date: endDate,
                    label
                },
                summary,
                chart_data,
                ledger
            }
        });
    } catch (err) {
        console.error('Error in getCashFlowReport:', err);
        res.status(500).json({ success: false, message: 'Gagal memuat arus kas', error: err.message });
    }
};

const addCashFlowEntry = async (req, res) => {
    try {
        const { type, amount, description, date } = req.body;
        const validTypes = ['spend', 'modal', 'prive'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Jenis kas tidak valid (pilih: spend, modal, atau prive)' });
        }
        const parsedAmount = parseInt(amount, 10);
        if (!parsedAmount || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Nominal harus lebih besar dari 0' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: 'Keterangan wajib diisi' });
        }

        const user_id = req.user?.id || null;
        const entry = await CashFlowModel.createCashFlowEntry({
            type,
            amount: parsedAmount,
            description: description.trim(),
            date: date || new Date().toISOString().split('T')[0],
            user_id
        });

        res.status(201).json({
            success: true,
            message: 'Catatan kas berhasil disimpan',
            data: entry
        });
    } catch (err) {
        console.error('Error in addCashFlowEntry:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan catatan kas', error: err.message });
    }
};

const editCashFlowEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, description, date } = req.body;
        const validTypes = ['spend', 'modal', 'prive'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Jenis kas tidak valid (pilih: spend, modal, atau prive)' });
        }
        const parsedAmount = parseInt(amount, 10);
        if (!parsedAmount || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Nominal harus lebih besar dari 0' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: 'Keterangan wajib diisi' });
        }

        const updated = await CashFlowModel.updateCashFlowEntry(id, {
            type,
            amount: parsedAmount,
            description: description.trim(),
            date
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Catatan kas tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Catatan kas berhasil diperbarui',
            data: updated
        });
    } catch (err) {
        console.error('Error in editCashFlowEntry:', err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui catatan kas', error: err.message });
    }
};

const removeCashFlowEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CashFlowModel.deleteCashFlowEntry(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Catatan kas tidak ditemukan' });
        }
        res.json({
            success: true,
            message: 'Catatan kas berhasil dihapus'
        });
    } catch (err) {
        console.error('Error in removeCashFlowEntry:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus catatan kas', error: err.message });
    }
};

module.exports = {
    getSalesReport,
    getTopProducts,
    getDailySales,
    getSalesByCategory,
    getCashFlowReport,
    addCashFlowEntry,
    editCashFlowEntry,
    removeCashFlowEntry
};


