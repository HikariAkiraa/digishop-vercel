const db = require('../config/db');

const getAllTransactions = async () => {
    const result = await db.query(
        `SELECT t.id, t.user_id, t.total_amount AS total, t.total_profit AS profit, t.created_at, u.name AS user_name
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
    );
    return result.rows;
};

const getTransactionById = async (id) => {
    const transaction = await db.query(
        `SELECT t.id, t.user_id, t.total_amount AS total, t.total_profit AS profit, t.created_at, u.name AS user_name
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [id]
    );
    if (!transaction.rows[0]) return null;

    const items = await db.query(
        `SELECT ti.id, ti.product_id, ti.quantity, ti.price_at_time AS price,
                (ti.quantity * ti.price_at_time) AS subtotal,
                p.name AS product_name, p.sku
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = $1`,
        [id]
    );

    return { ...transaction.rows[0], items: items.rows };
};

const createTransaction = async ({ user_id, items }) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        let totalAmount = 0;
        let totalProfit = 0;

        // Validasi stok & hitung total
        for (const item of items) {
            const product = await client.query('SELECT id, price, cost_price, stock FROM products WHERE id = $1', [item.product_id]);
            if (!product.rows[0]) throw { statusCode: 404, message: `Produk ID ${item.product_id} tidak ditemukan` };
            if (product.rows[0].stock < item.quantity) throw { statusCode: 400, message: `Stok produk ID ${item.product_id} tidak mencukupi` };
            
            item.price_at_time = product.rows[0].price;
            item.cost_at_time = product.rows[0].cost_price;
            
            totalAmount += item.price_at_time * item.quantity;
            totalProfit += (item.price_at_time - item.cost_at_time) * item.quantity;
        }

        // Buat transaksi
        const transaction = await client.query(
            'INSERT INTO transactions (user_id, total_amount, total_profit) VALUES ($1, $2, $3) RETURNING *',
            [user_id, totalAmount, totalProfit]
        );
        const transactionId = transaction.rows[0].id;

        // Insert item & kurangi stok
        for (const item of items) {
            await client.query(
                'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_time, cost_at_time) VALUES ($1, $2, $3, $4, $5)',
                [transactionId, item.product_id, item.quantity, item.price_at_time, item.cost_at_time]
            );
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
            await client.query(
                `INSERT INTO stock_movements (product_id, type, quantity, note, user_id)
                 VALUES ($1, 'OUT', $2, $3, $4)`,
                [item.product_id, item.quantity, `Transaksi #${transactionId}`, user_id]
            );
        }

        await client.query('COMMIT');
        return { ...transaction.rows[0], items };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const deleteTransaction = async (id, user_id) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Cek transaksi
        const tx = await client.query('SELECT * FROM transactions WHERE id = $1', [id]);
        if (!tx.rows[0]) throw { statusCode: 404, message: 'Transaksi tidak ditemukan' };

        // Ambil item untuk kembalikan stok
        const items = await client.query('SELECT product_id, quantity FROM transaction_items WHERE transaction_id = $1', [id]);
        
        for (const item of items.rows) {
            // Restore stock
            await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
            // Catat pergerakan stok sebagai pembatalan
            await client.query(
                `INSERT INTO stock_movements (product_id, type, quantity, note, user_id)
                 VALUES ($1, 'IN', $2, $3, $4)`,
                [item.product_id, item.quantity, `Pembatalan Transaksi #${id}`, user_id]
            );
        }

        // Hapus transaksi (cascade otomatis menghapus transaction_items)
        await client.query('DELETE FROM transactions WHERE id = $1', [id]);

        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getAllTransactions, getTransactionById, createTransaction, deleteTransaction };
