const pool = require('../config/db');

// GET /api/maintenance
const getRequests = async (req, res, next) => {
  try {
    const { status, priority, unit_id } = req.query;
    let query = `
      SELECT mr.*, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name
      FROM maintenance_requests mr
      JOIN units u ON mr.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      LEFT JOIN tenants t ON mr.tenant_id = t.id
      LEFT JOIN users usr ON t.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id=$1', [req.user.id]);
      if (tenantRes.rows.length) {
        params.push(tenantRes.rows[0].id);
        query += ` AND mr.tenant_id = $${params.length}`;
      }
    } else if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    if (status) { params.push(status); query += ` AND mr.status = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND mr.priority = $${params.length}`; }
    if (unit_id) { params.push(unit_id); query += ` AND mr.unit_id = $${params.length}`; }

    query += ' ORDER BY CASE mr.priority WHEN \'urgent\' THEN 1 WHEN \'high\' THEN 2 WHEN \'normal\' THEN 3 ELSE 4 END, mr.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /api/maintenance - Tenant submits a request
const createRequest = async (req, res, next) => {
  try {
    const { unit_id, title, description, category, priority } = req.body;

    let tenant_id = null;
    if (req.user.role === 'tenant') {
      const t = await pool.query('SELECT id FROM tenants WHERE user_id=$1', [req.user.id]);
      tenant_id = t.rows[0]?.id;
    }

    const result = await pool.query(`
      INSERT INTO maintenance_requests (unit_id, tenant_id, title, description, category, priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [unit_id, tenant_id, title, description, category || 'general', priority || 'normal']);

    res.status(201).json({ success: true, message: 'Maintenance request submitted.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/maintenance/:id - Update status (landlord/admin)
const updateRequest = async (req, res, next) => {
  try {
    const { status, assigned_to } = req.body;
    const resolvedAt = status === 'resolved' ? 'NOW()' : 'NULL';

    const result = await pool.query(`
      UPDATE maintenance_requests
      SET status=$1, assigned_to=$2, resolved_at=${resolvedAt}, updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [status, assigned_to, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });

    await pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1,'MAINTENANCE_UPDATED','maintenance_request',$2)`, [req.user.id, req.params.id]);
    res.json({ success: true, message: 'Request updated.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/maintenance/stats
const getStats = async (req, res, next) => {
  try {
    let whereClause = '';
    const params = [];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      whereClause = `WHERE p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE mr.status = 'open') AS open,
        COUNT(*) FILTER (WHERE mr.status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE mr.status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE mr.priority = 'urgent') AS urgent
      FROM maintenance_requests mr
      JOIN units u ON mr.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      ${whereClause}
    `, params);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getRequests, createRequest, updateRequest, getStats };