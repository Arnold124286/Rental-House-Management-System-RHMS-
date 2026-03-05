const pool = require('../config/db');

// GET /api/complaints
const getComplaints = async (req, res, next) => {
    try {
        let query, params;
        if (req.user.role === 'admin') {
            query = `
        SELECT c.*, u.first_name || ' ' || u.last_name AS tenant_name, p.name AS property_name, un.unit_number
        FROM complaints c
        JOIN tenants t ON c.tenant_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN properties p ON c.property_id = p.id
        LEFT JOIN units un ON c.unit_id = un.id
        ORDER BY c.created_at DESC
      `;
            params = [];
        } else if (req.user.role === 'landlord') {
            query = `
        SELECT c.*, u.first_name || ' ' || u.last_name AS tenant_name, p.name AS property_name, un.unit_number
        FROM complaints c
        JOIN tenants t ON c.tenant_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN properties p ON c.property_id = p.id
        LEFT JOIN units un ON c.unit_id = un.id
        JOIN landlords l ON p.landlord_id = l.id
        WHERE l.user_id = $1
        ORDER BY c.created_at DESC
      `;
            params = [req.user.id];
        } else {
            query = `
        SELECT c.*, p.name AS property_name, un.unit_number
        FROM complaints c
        JOIN tenants t ON c.tenant_id = t.id
        JOIN properties p ON c.property_id = p.id
        LEFT JOIN units un ON c.unit_id = un.id
        WHERE t.user_id = $1
        ORDER BY c.created_at DESC
      `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
};

// POST /api/complaints
const createComplaint = async (req, res, next) => {
    try {
        const { property_id, unit_id, subject, description } = req.body;
        const tenant = await pool.query('SELECT id FROM tenants WHERE user_id = $1', [req.user.id]);
        if (!tenant.rows.length) return res.status(403).json({ success: false, message: 'Only tenants can file complaints.' });

        const result = await pool.query(`
      INSERT INTO complaints (tenant_id, property_id, unit_id, subject, description, status)
      VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *
    `, [tenant.rows[0].id, property_id, unit_id, subject, description]);

        res.status(201).json({ success: true, message: 'Complaint filed successfully.', data: result.rows[0] });
    } catch (err) { next(err); }
};

// PUT /api/complaints/:id/resolve
const resolveComplaint = async (req, res, next) => {
    try {
        const { resolution } = req.body;
        const result = await pool.query(`
      UPDATE complaints SET status = 'resolved', resolution = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [resolution, req.params.id]);

        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Complaint not found.' });
        res.json({ success: true, message: 'Complaint marked as resolved.', data: result.rows[0] });
    } catch (err) { next(err); }
};

module.exports = { getComplaints, createComplaint, resolveComplaint };
