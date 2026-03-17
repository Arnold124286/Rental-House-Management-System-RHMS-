const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rhms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to PostgreSQL database');
    console.log('🌱 Seeding database...');

    const adminPass = await bcrypt.hash('Admin@2024!', 12);
    const landlordPass = await bcrypt.hash('Landlord@2024!', 12);
    const tenantPass = await bcrypt.hash('Tenant@2024!', 12);

    await client.query('BEGIN');

    // Clear existing data (ordered by FK deps)
    await client.query('DELETE FROM complaints');
    await client.query('DELETE FROM audit_logs');

    await client.query('DELETE FROM maintenance_requests');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM leases');
    await client.query('DELETE FROM units');
    await client.query('DELETE FROM properties');
    await client.query('DELETE FROM landlords');
    await client.query('DELETE FROM tenants');
    await client.query('DELETE FROM users');

    // ── Users ──────────────────────────────────────────────────────────
    const adminRes = await client.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, worker_id)
      VALUES ('admin', 'admin@rhms.com', $1, 'admin', 'System', 'Admin', 'RHMS-ST-001')
      RETURNING id
    `, [adminPass]);


    const landlordRes = await client.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES ('jkamau', 'jkamau@rhms.com', $1, 'landlord', 'John', 'Kamau')
      RETURNING id
    `, [landlordPass]);

    const tenantRes = await client.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES ('mwanjiru', 'mwanjiru@rhms.com', $1, 'tenant', 'Mary', 'Wanjiru')
      RETURNING id
    `, [tenantPass]);

    const landlordUserId = landlordRes.rows[0].id;
    const tenantUserId = tenantRes.rows[0].id;

    // ── Profiles ───────────────────────────────────────────────────────
    const landlordProfileRes = await client.query(`
      INSERT INTO landlords (user_id, phone, national_id, status, business_name)
      VALUES ($1, '0712345678', '12345678', 'approved', 'Kamau Properties')
      RETURNING id
    `, [landlordUserId]);


    const tenantProfileRes = await client.query(`
      INSERT INTO tenants (user_id, phone, national_id)
      VALUES ($1, '0798765432', '87654321')
      RETURNING id
    `, [tenantUserId]);

    const landlordId = landlordProfileRes.rows[0].id;
    const tenantId = tenantProfileRes.rows[0].id;

    // ── Property ───────────────────────────────────────────────────────
    const propRes = await client.query(`
      INSERT INTO properties (landlord_id, name, address, city, description, total_units, status, category)
      VALUES ($1, 'Sunset Apartments', '123 Moi Avenue', 'Nairobi',
              'Modern apartments in the heart of Nairobi', 3, 'approved', 'rental')
      RETURNING id
    `, [landlordId]);


    const propertyId = propRes.rows[0].id;

    // ── Units ──────────────────────────────────────────────────────────
    const unit1Res = await client.query(`
      INSERT INTO units (property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, status, video_url)
      VALUES ($1, 'A101', 1, 2, 1, 25000, 'occupied', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      RETURNING id
    `, [propertyId]);

    await client.query(`
      INSERT INTO units (property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, status, video_url)
      VALUES ($1, 'A102', 1, 1, 1, 18000, 'vacant', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    `, [propertyId]);

    await client.query(`
      INSERT INTO units (property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, status, video_url)
      VALUES ($1, 'B201', 2, 3, 2, 35000, 'vacant', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    `, [propertyId]);


    const unitId = unit1Res.rows[0].id;

    // ── Lease ──────────────────────────────────────────────────────────
    const leaseRes = await client.query(`
      INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status)
      VALUES ($1, $2, '2025-01-01', '2026-12-31', 25000, 50000, 'active')
      RETURNING id
    `, [unitId, tenantId]);

    const leaseId = leaseRes.rows[0].id;

    // ── Payments ───────────────────────────────────────────────────────
    const payments = [
      ['2026-01-05', '2026-01', 'paystack'],
      ['2026-02-03', '2026-02', 'paystack'],
      ['2026-03-01', '2026-03', 'bank_transfer'],
    ];
    for (const [date, month, method] of payments) {
      await client.query(`
        INSERT INTO payments (lease_id, amount, paid_at, payment_month, method, status)
        VALUES ($1, 25000, $2, $3, $4, 'confirmed')
      `, [leaseId, date, month, method]);
    }

    // ── Maintenance ────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO maintenance_requests (unit_id, tenant_id, title, description, category, priority, status)
      VALUES ($1, $2, 'Leaking kitchen tap', 'The kitchen tap has been dripping for 3 days', 'plumbing', 'normal', 'open')
    `, [unitId, tenantId]);

    // ── Complaints ─────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO complaints (tenant_id, property_id, unit_id, subject, description, status)
      VALUES ($1, $2, $3, 'Noise Complaint', 'Neighbors are playing loud music late at night.', 'open')
    `, [tenantId, propertyId, unitId]);


    await client.query('COMMIT');

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('👤 Production Accounts:');
    console.log('   Admin:    admin@rhms.com    / Admin@2024!');
    console.log('   Landlord: jkamau@rhms.com   / Landlord@2024!');
    console.log('   Tenant:   mwanjiru@rhms.com / Tenant@2024!');
    console.log('');
    console.log('⚠️  Change these passwords after first login!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();