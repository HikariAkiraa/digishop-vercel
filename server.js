require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const stockRoutes = require('./routes/stockRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');

const db = require('./config/db');

app.use(express.json());

// Health check endpoint for K8s (checks DB connection too)
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({ status: 'OK', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'Error', database: 'disconnected' });
    }
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/contacts', contactRoutes);

// Serve React frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d' // Tambahkan header Cache-Control 30 hari untuk aset statis agar loading cepat sekali
}));
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server DigiShop berjalan di http://localhost:${port}`);
    });
}

module.exports = app;