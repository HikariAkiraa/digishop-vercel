require('dotenv').config();
const { Pool } = require('pg');

const isVercel = Boolean(process.env.VERCEL);
const isSupabasePooler = process.env.DB_HOST && process.env.DB_HOST.includes('pooler.supabase.com');

// Port 6543 adalah Transaction Mode (Sangat disarankan untuk Vercel Serverless)
// Port 5432 adalah Session Mode (dibatasi 15 client total di Supabase)
let dbPort = parseInt(process.env.DB_PORT, 10) || 5432;
if (isSupabasePooler && isVercel && dbPort === 5432) {
    dbPort = 6543;
}

const pool = new Pool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     dbPort,
    ssl: (isSupabasePooler || isVercel || process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
    max: isVercel ? 2 : 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000
});

// Cek koneksi hanya saat local development agar tidak membebani serverless cold-start
if (!isVercel) {
    pool.query('SELECT 1')
        .then(() => console.log(`Terhubung ke database PostgreSQL (${process.env.DB_HOST}:${dbPort})`))
        .catch(err => console.error('Gagal terhubung ke database:', err.message));
}

module.exports = pool;

