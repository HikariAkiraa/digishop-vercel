const db = require('../config/db');

// Laporan penjualan per periode
const getSalesByPeriod = async (startDate, endDate) => {
    const result = await db.query(
        `SELECT
            COUNT(*) AS total_transactions,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(SUM(total_profit), 0) AS total_profit,
            COALESCE(SUM(ti.total_item), 0) AS total_items
         FROM transactions t
         LEFT JOIN (
            SELECT transaction_id, SUM(quantity) AS total_item
            FROM transaction_items
            GROUP BY transaction_id
         ) ti ON t.id = ti.transaction_id
         WHERE t.created_at >= $1 AND t.created_at < $2::date + INTERVAL '1 day'`,
        [startDate, endDate]
    );
    return result.rows[0];
};

// Daftar transaksi per periode
const getTransactionsByPeriod = async (startDate, endDate) => {
    const result = await db.query(
        `SELECT t.id, t.total_amount AS total, t.total_profit AS profit, t.created_at, u.name AS user_name
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         WHERE t.created_at >= $1 AND t.created_at < $2::date + INTERVAL '1 day'
         ORDER BY t.created_at DESC`,
        [startDate, endDate]
    );
    return result.rows;
};

// Produk terlaris
const getTopProducts = async (limit = 10) => {
    const result = await db.query(
        `SELECT p.id, p.name, p.sku, p.price,
            SUM(ti.quantity) AS total_sold,
            SUM(ti.quantity * ti.price_at_time) AS total_revenue,
            SUM(ti.quantity * (ti.price_at_time - ti.cost_at_time)) AS total_profit
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         GROUP BY p.id, p.name, p.sku, p.price
         ORDER BY total_sold DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows;
};

// Ringkasan penjualan harian (30 hari terakhir)
const getDailySales = async (days = 30) => {
    const result = await db.query(
        `SELECT
            DATE(t.created_at) AS date,
            COUNT(*) AS total_transactions,
            SUM(t.total_amount) AS total_revenue,
            SUM(t.total_profit) AS total_profit
         FROM transactions t
         WHERE t.created_at >= CURRENT_DATE - $1 * INTERVAL '1 day'
         GROUP BY DATE(t.created_at)
         ORDER BY date DESC`,
        [days]
    );
    return result.rows;
};

// Penjualan per kategori
const getSalesByCategory = async () => {
    const result = await db.query(
        `SELECT c.id, c.name AS category_name,
            COALESCE(SUM(ti.quantity), 0) AS total_sold,
            COALESCE(SUM(ti.quantity * ti.price_at_time), 0) AS total_revenue,
            COALESCE(SUM(ti.quantity * (ti.price_at_time - ti.cost_at_time)), 0) AS total_profit
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id
         LEFT JOIN transaction_items ti ON p.id = ti.product_id
         GROUP BY c.id, c.name
         ORDER BY total_revenue DESC`
    );
    return result.rows;
};

module.exports = { getSalesByPeriod, getTransactionsByPeriod, getTopProducts, getDailySales, getSalesByCategory };
