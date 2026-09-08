const db = require('../config/db');

let tableEnsured = false;
const ensureTableExists = async () => {
    if (tableEnsured) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS cash_flows (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                amount INT NOT NULL CHECK (amount > 0),
                description TEXT NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                user_id INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        tableEnsured = true;
    } catch (err) {
        console.error('Error ensuring cash_flows table exists:', err.message);
    }
};

// Pastikan tabel siap saat modul dimuat
ensureTableExists();

const getCashFlowSummary = async (startDate, endDate) => {
    await ensureTableExists();

    // 1. Total Omzet dari Transaksi Penjualan
    const txResult = await db.query(
        `SELECT
            COALESCE(SUM(total_amount), 0) AS omzet,
            COUNT(*) AS total_transactions
         FROM transactions
         WHERE created_at >= $1 AND created_at < $2::date + INTERVAL '1 day'`,
        [startDate, endDate]
    );

    // 2. Total dari Buku Kas (Spend, Modal, Prive)
    const cfResult = await db.query(
        `SELECT
            type,
            COALESCE(SUM(amount), 0) AS total_amount,
            COUNT(*) AS count
         FROM cash_flows
         WHERE date >= $1 AND date <= $2
         GROUP BY type`,
        [startDate, endDate]
    );

    const omzet = parseInt(txResult.rows[0]?.omzet || 0, 10);
    const total_transactions = parseInt(txResult.rows[0]?.total_transactions || 0, 10);

    let spend = 0;
    let modal = 0;
    let prive = 0;

    cfResult.rows.forEach(row => {
        const val = parseInt(row.total_amount, 10);
        if (row.type === 'spend') spend = val;
        else if (row.type === 'modal') modal = val;
        else if (row.type === 'prive') prive = val;
    });

    const total_inflow = omzet + modal;
    const total_outflow = spend + prive;
    const net_cash_flow = total_inflow - total_outflow;
    const operating_margin = omzet - spend;

    return {
        omzet,
        spend,
        modal,
        prive,
        total_inflow,
        total_outflow,
        net_cash_flow,
        operating_margin,
        total_transactions
    };
};

const getCashFlowChart = async (startDate, endDate, groupBy = 'month') => {
    await ensureTableExists();

    const datePattern = groupBy === 'year' ? 'YYYY' : 'YYYY-MM';

    // Ambil transaksi per periode
    const txResult = await db.query(
        `SELECT
            TO_CHAR(created_at, '${datePattern}') AS period_key,
            COALESCE(SUM(total_amount), 0) AS omzet
         FROM transactions
         WHERE created_at >= $1 AND created_at < $2::date + INTERVAL '1 day'
         GROUP BY TO_CHAR(created_at, '${datePattern}')
         ORDER BY period_key ASC`,
        [startDate, endDate]
    );

    // Ambil cash flows per periode
    const cfResult = await db.query(
        `SELECT
            TO_CHAR(date, '${datePattern}') AS period_key,
            type,
            COALESCE(SUM(amount), 0) AS total_amount
         FROM cash_flows
         WHERE date >= $1 AND date <= $2
         GROUP BY TO_CHAR(date, '${datePattern}'), type
         ORDER BY period_key ASC`,
        [startDate, endDate]
    );

    const periodMap = new Map();

    // Inisialisasi peta periode jika bulanan agar urutan dan label jelas
    if (groupBy === 'month') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const curr = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        while (curr <= endMonth) {
            const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
            const label = `${monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
            periodMap.set(key, {
                period_key: key,
                label,
                omzet: 0,
                spend: 0,
                modal: 0,
                prive: 0,
                inflow: 0,
                outflow: 0,
                net: 0
            });
            curr.setMonth(curr.getMonth() + 1);
        }
    }

    // Isi data transaksi
    txResult.rows.forEach(r => {
        if (!periodMap.has(r.period_key)) {
            periodMap.set(r.period_key, {
                period_key: r.period_key,
                label: r.period_key,
                omzet: 0,
                spend: 0,
                modal: 0,
                prive: 0,
                inflow: 0,
                outflow: 0,
                net: 0
            });
        }
        const p = periodMap.get(r.period_key);
        p.omzet = parseInt(r.omzet, 10);
    });

    // Isi data cash flow
    cfResult.rows.forEach(r => {
        if (!periodMap.has(r.period_key)) {
            periodMap.set(r.period_key, {
                period_key: r.period_key,
                label: r.period_key,
                omzet: 0,
                spend: 0,
                modal: 0,
                prive: 0,
                inflow: 0,
                outflow: 0,
                net: 0
            });
        }
        const p = periodMap.get(r.period_key);
        const amt = parseInt(r.total_amount, 10);
        if (r.type === 'spend') p.spend = amt;
        else if (r.type === 'modal') p.modal = amt;
        else if (r.type === 'prive') p.prive = amt;
    });

    // Hitung inflow, outflow, net untuk setiap periode
    const chartData = Array.from(periodMap.values()).map(p => {
        p.inflow = p.omzet + p.modal;
        p.outflow = p.spend + p.prive;
        p.net = p.inflow - p.outflow;
        return p;
    });

    return chartData;
};

const getCashFlowLedger = async (startDate, endDate) => {
    await ensureTableExists();

    // 1. Ambil transaksi penjualan dengan rincian produk yang dibeli
    const txQuery = `
        SELECT
            t.id,
            t.created_at AS raw_date,
            'omzet' AS type,
            'Penjualan Kasir' AS type_label,
            COALESCE(
                CONCAT('Transaksi Kasir #', t.id, ' (', items_summary.items_text, ')'),
                CONCAT('Transaksi Kasir #', t.id)
            ) AS description,
            t.total_amount AS in_amount,
            0 AS out_amount,
            true AS is_system,
            u.name AS user_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN (
            SELECT
                ti.transaction_id,
                STRING_AGG(CONCAT(ti.quantity, 'x ', p.name), ', ') AS items_text
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            GROUP BY ti.transaction_id
        ) items_summary ON t.id = items_summary.transaction_id
        WHERE t.created_at >= $1 AND t.created_at < $2::date + INTERVAL '1 day'
    `;

    // 2. Ambil entri buku kas (spend, modal, prive)
    const cfQuery = `
        SELECT
            cf.id,
            COALESCE((cf.date + cf.created_at::time)::timestamp, cf.created_at, cf.date::timestamp) AS raw_date,
            cf.date::text AS date_str,
            cf.type,
            CASE
                WHEN cf.type = 'spend' THEN 'Spend (Pengeluaran)'
                WHEN cf.type = 'modal' THEN 'Tambah Modal'
                WHEN cf.type = 'prive' THEN 'Prive (Pribadi)'
                ELSE cf.type
            END AS type_label,
            cf.description,
            cf.amount,
            CASE WHEN cf.type = 'modal' THEN cf.amount ELSE 0 END AS in_amount,
            CASE WHEN cf.type IN ('spend', 'prive') THEN cf.amount ELSE 0 END AS out_amount,
            false AS is_system,
            u.name AS user_name
        FROM cash_flows cf
        LEFT JOIN users u ON cf.user_id = u.id
        WHERE cf.date >= $1 AND cf.date <= $2
    `;

    const [txRes, cfRes] = await Promise.all([
        db.query(txQuery, [startDate, endDate]),
        db.query(cfQuery, [startDate, endDate])
    ]);

    // Gabungkan entri
    const combined = [
        ...txRes.rows.map(r => ({
            ...r,
            id: `tx-${r.id}`,
            numeric_id: r.id,
            in_amount: parseInt(r.in_amount, 10),
            out_amount: parseInt(r.out_amount, 10),
        })),
        ...cfRes.rows.map(r => ({
            ...r,
            id: `cf-${r.id}`,
            numeric_id: r.id,
            amount: parseInt(r.amount, 10),
            in_amount: parseInt(r.in_amount, 10),
            out_amount: parseInt(r.out_amount, 10),
        }))
    ];

    // 1. Urutkan dari terlama ke terbaru untuk menghitung saldo berjalan (running balance)
    combined.sort((a, b) => {
        const timeA = new Date(a.raw_date).getTime();
        const timeB = new Date(b.raw_date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return (a.numeric_id || 0) - (b.numeric_id || 0);
    });

    let runningBalance = 0;
    const ledgerWithBalance = combined.map(item => {
        runningBalance += (item.in_amount - item.out_amount);
        return {
            ...item,
            running_balance: runningBalance
        };
    });

    // 2. Urutkan dari yang TERBARU ke TERLAMA (Newest first) agar transaksi terkini selalu berada di paling atas
    ledgerWithBalance.sort((a, b) => {
        const timeA = new Date(a.raw_date).getTime();
        const timeB = new Date(b.raw_date).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.numeric_id || 0) - (a.numeric_id || 0);
    });

    return ledgerWithBalance;
};


const createCashFlowEntry = async ({ type, amount, description, date, user_id }) => {
    await ensureTableExists();
    const result = await db.query(
        `INSERT INTO cash_flows (type, amount, description, date, user_id)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
         RETURNING *`,
        [type, amount, description, date || null, user_id || null]
    );
    return result.rows[0];
};

const updateCashFlowEntry = async (id, { type, amount, description, date }) => {
    await ensureTableExists();
    const result = await db.query(
        `UPDATE cash_flows
         SET type = $1, amount = $2, description = $3, date = COALESCE($4, date)
         WHERE id = $5
         RETURNING *`,
        [type, amount, description, date || null, id]
    );
    return result.rows[0];
};

const deleteCashFlowEntry = async (id) => {
    await ensureTableExists();
    const result = await db.query(
        `DELETE FROM cash_flows WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = {
    ensureTableExists,
    getCashFlowSummary,
    getCashFlowChart,
    getCashFlowLedger,
    createCashFlowEntry,
    updateCashFlowEntry,
    deleteCashFlowEntry
};

