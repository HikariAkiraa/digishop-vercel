const db = require('../config/db');

const getMovementsByProduct = async (productId) => {
    const result = await db.query(
        `SELECT sm.*, u.name AS user_name
         FROM stock_movements sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.product_id = $1
         ORDER BY sm.created_at DESC`,
        [productId]
    );
    return result.rows;
};

const addStock = async ({ product_id, quantity, note, user_id }) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const movement = await client.query(
            `INSERT INTO stock_movements (product_id, type, quantity, note, user_id)
             VALUES ($1, 'IN', $2, $3, $4) RETURNING *`,
            [product_id, quantity, note, user_id]
        );

        await client.query(
            'UPDATE products SET stock = stock + $1 WHERE id = $2',
            [quantity, product_id]
        );

        await client.query('COMMIT');
        return movement.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const reduceStock = async ({ product_id, quantity, note, user_id }) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const product = await client.query('SELECT stock FROM products WHERE id = $1', [product_id]);
        if (!product.rows[0]) throw { statusCode: 404, message: 'Produk tidak ditemukan' };
        if (product.rows[0].stock < quantity) throw { statusCode: 400, message: 'Stok tidak mencukupi' };

        const movement = await client.query(
            `INSERT INTO stock_movements (product_id, type, quantity, note, user_id)
             VALUES ($1, 'OUT', $2, $3, $4) RETURNING *`,
            [product_id, quantity, note, user_id]
        );

        await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [quantity, product_id]
        );

        await client.query('COMMIT');
        return movement.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getMovementsByProduct, addStock, reduceStock };
