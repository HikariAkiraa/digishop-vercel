 const db = require('../config/db');

const findByEmail = async (email) => {
    const result = await db.query(
        'SELECT users.*, roles.name AS role FROM users JOIN roles ON users.role_id = roles.id WHERE email = $1',
        [email]
    );
    return result.rows[0];
};

const createUser = async ({ name, email, password_hash, role_id }) => {
    const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role_id, created_at`,
        [name, email, password_hash, role_id]
    );
    return result.rows[0];
};



const findById = async (id) => {
    const result = await db.query(
        'SELECT users.*, roles.name AS role FROM users JOIN roles ON users.role_id = roles.id WHERE users.id = $1',
        [id]
    );
    return result.rows[0];
};

const updateProfile = async (id, email, password_hash) => {
    const result = await db.query(
        `UPDATE users SET email = $1, password_hash = $2 WHERE id = $3 RETURNING id, name, email, role_id`,
        [email, password_hash, id]
    );
    return result.rows[0];
};

module.exports = { findByEmail, createUser, findById, updateProfile };
