const pool = require('../config/db');

// GET /api/leases
const getLeases = async (req, res, next) => {
  try {
    const { status, tenant_id } = req.query;
    let query = `
      SELECT l.*, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name,
             usr.email AS tenant_email, t.phone AS tenant_phone
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id = $1', [req.user.id]);
      if (tenantRes.rows.length) {
        params.push(tenantRes.rows[0].id);
        query += ` AND l.tenant_id = $${params.length}`;
      }
    } else if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    if (status) { params.push(status); query += ` AND l.status = $${params.length}`; }
    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/leases/:id
const getLease = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.unit_number, u.bedrooms, u.bathrooms, p.name AS property_name, p.address AS property_address,
             usr.first_name || ' ' || usr.last_name AS tenant_name, usr.email AS tenant_email, t.phone AS tenant_phone, t.national_id
      FROM leases l
      JOIN units u ON l.unit_id = u.id JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id JOIN users usr ON t.user_id = usr.id
      WHERE l.id = $1
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Lease not found.' });

    const payments = await pool.query(
      'SELECT * FROM payments WHERE lease_id = $1 ORDER BY paid_at DESC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...result.rows[0], payments: payments.rows } });
  } catch (err) { next(err); }
};

// POST /api/leases - Allocate unit to tenant
const createLease = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, notes } = req.body;

    await client.query('BEGIN');

    // Check unit is vacant
    const unitCheck = await client.query('SELECT status FROM units WHERE id = $1', [unit_id]);
    if (!unitCheck.rows.length) return res.status(404).json({ success: false, message: 'Unit not found.' });
    if (unitCheck.rows[0].status !== 'vacant') {
      return res.status(400).json({ success: false, message: 'Unit is not available.' });
    }

    // Check no active lease for this tenant on this unit
    const leaseCheck = await client.query(
      `SELECT id FROM leases WHERE unit_id=$1 AND status='active'`, [unit_id]
    );
    if (leaseCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Unit already has an active lease.' });
    }

    const leaseRes = await client.query(`
      INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount || 0, notes]);

    // Mark unit as occupied
    await client.query(`UPDATE units SET status='occupied', updated_at=NOW() WHERE id=$1`, [unit_id]);
    await client.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1,'LEASE_CREATED','lease',$2)`, [req.user.id, leaseRes.rows[0].id]);

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Lease created and unit allocated.', data: leaseRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PUT /api/leases/:id/terminate
const terminateLease = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE leases SET status='terminated', end_date=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Lease not found.' });

    await client.query(`UPDATE units SET status='vacant', updated_at=NOW() WHERE id=$1`, [result.rows[0].unit_id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Lease terminated and unit is now vacant.', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getLeases, getLease, createLease, terminateLease };