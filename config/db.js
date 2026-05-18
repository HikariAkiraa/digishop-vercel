require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     process.env.DB_PORT
});

const connectWithRetry = () => {
    console.log('Mencoba menghubungkan ke database...');
    pool.connect()
        .then(() => console.log('Terhubung ke database PostgreSQL'))
        .catch(err => {
            console.error('Gagal terhubung ke database:', err.message);
            console.log('Mencoba lagi dalam 5 detik...');
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();

module.exports = pool;
