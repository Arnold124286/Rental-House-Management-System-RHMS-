const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rhms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function check() {
    const tables = ['users', 'landlords', 'tenants', 'properties', 'units', 'leases', 'payments', 'maintenance_requests'];
    for (const table of tables) {
        try {
            const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
            console.log(`Table: ${table}`);
            res.rows.forEach(row => {
                console.log(`  - ${row.column_name} (${row.data_type})`);
            });
        } catch (err) {
            console.error(`Error checking table ${table}: ${err.message}`);
        }
    }
    await pool.end();
}

check();
