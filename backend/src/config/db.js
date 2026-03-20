const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // ✅ Production / Neon / Render / Cloud DB
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized: false,
    },

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

} else {
  // ✅ Local PostgreSQL (development)
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rhms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}


// ✅ Success connection log
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Connected to PostgreSQL database');
  }
});


// ❌ Error handler
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});


// ✅ Test connection at startup (very useful on Render)
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection OK');
  } catch (err) {
    console.error('❌ Database connection FAILED:', err.message);
  }
})();


module.exports = pool;