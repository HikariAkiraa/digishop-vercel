const db = require('../config/db');

const getAllProducts = async () => {
    const result = await db.query(
        `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.id ASC`
    );
    return result.rows;
};

const getProductById = async (id) => {
    const result = await db.query(
        `SELECT p.*, c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = $1  `,
        [id]
    );
    return result.rows[0];
};

const createProduct = async ({ name, sku, description, cost_price, price, stock, category_id }) => {
    const result = await db.query(
        `INSERT INTO products (name, sku, description, cost_price, price, stock, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, sku, description, cost_price || 0, price, stock, category_id]
    );
    return result.rows[0];
};

const updateProduct = async (id, { name, sku, description, cost_price, price, stock, category_id }) => {
    const result = await db.query(
        `UPDATE products
         SET name = $1, sku = $2, description = $3, cost_price = $4, price = $5, stock = $6, category_id = $7
         WHERE id = $8
         RETURNING *`,
        [name, sku, description, cost_price || 0, price, stock, category_id, id]
    );
    return result.rows[0];
};

const deleteProduct = async (id) => {
    const result = await db.query(
        'DELETE FROM products WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };

