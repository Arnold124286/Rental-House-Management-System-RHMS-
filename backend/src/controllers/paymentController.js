const pool = require('../config/db');

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { lease_id, month, year } = req.query;
    let query = `
      SELECT pay.*, l.rent_amount AS monthly_rent, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id=$1', [req.user.id]);
      if (tenantRes.rows.length) {
        params.push(tenantRes.rows[0].id);
        query += ` AND t.id = $${params.length}`;
      }
    } else if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    if (lease_id) { params.push(lease_id); query += ` AND pay.lease_id = $${params.length}`; }
    if (month && year) {
      params.push(`${year}-${String(month).padStart(2,'0')}`);
      query += ` AND pay.payment_month = $${params.length}`;
    }

    query += ' ORDER BY pay.paid_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /api/payments - Record a payment
const createPayment = async (req, res, next) => {
  try {
    const { lease_id, amount, method, transaction_ref, payment_month, notes } = req.body;

    // Validate lease exists
    const lease = await pool.query('SELECT * FROM leases WHERE id=$1 AND status=$2', [lease_id, 'active']);
    if (!lease.rows.length) return res.status(404).json({ success: false, message: 'Active lease not found.' });

    const result = await pool.query(`
      INSERT INTO payments (lease_id, amount, method, transaction_ref, payment_month, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [lease_id, amount, method || 'cash', transaction_ref, payment_month, notes]);

    await pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1,'PAYMENT_RECORDED','payment',$2)`, [req.user.id, result.rows[0].id]);
    res.status(201).json({ success: true, message: 'Payment recorded.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/payments/summary - Financial summary
const getPaymentSummary = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let landlordFilter = '';
    const params = [targetYear + '%'];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      landlordFilter = `AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const monthly = await pool.query(`
      SELECT payment_month, SUM(amount) AS total, COUNT(*) AS count
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE pay.payment_month LIKE $1 AND pay.status = 'confirmed' ${landlordFilter}
      GROUP BY payment_month ORDER BY payment_month
    `, params);

    const totals = await pool.query(`
      SELECT SUM(amount) AS total_collected,
             COUNT(*) AS total_payments
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE pay.payment_month LIKE $1 AND pay.status = 'confirmed' ${landlordFilter}
    `, params);

    res.json({ success: true, data: { monthly: monthly.rows, ...totals.rows[0] } });
  } catch (err) { next(err); }
};

// GET /api/payments/arrears
const getArrears = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let query = `
      SELECT l.id AS lease_id, l.rent_amount, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name, usr.email AS tenant_email, t.phone
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE l.status = 'active'
      AND l.id NOT IN (
        SELECT lease_id FROM payments WHERE payment_month = $1 AND status = 'confirmed'
      )
    `;
    const params = [currentMonth];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, month: currentMonth });
  } catch (err) { next(err); }
};

module.exports = { getPayments, createPayment, getPaymentSummary, getArrears };