const pool = require('../config/db');

// GET /api/lease-requests
const getLeaseRequests = async (req, res, next) => {
    try {
        let query, params;
        if (req.user.role === 'admin') {
            query = `
        SELECT lr.*, u.unit_number, p.name AS property_name, 
               usr.first_name || ' ' || usr.last_name AS tenant_name,
               usr.email AS tenant_email
        FROM lease_requests lr
        JOIN units u ON lr.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN tenants t ON lr.tenant_id = t.id
        JOIN users usr ON t.user_id = usr.id
        ORDER BY lr.created_at DESC
      `;
            params = [];
        } else if (req.user.role === 'landlord') {
            query = `
        SELECT lr.*, u.unit_number, p.name AS property_name, 
               usr.first_name || ' ' || usr.last_name AS tenant_name,
               usr.email AS tenant_email
        FROM lease_requests lr
        JOIN units u ON lr.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN tenants t ON lr.tenant_id = t.id
        JOIN users usr ON t.user_id = usr.id
        WHERE p.landlord_id = (SELECT id FROM landlords WHERE user_id = $1)
        ORDER BY lr.created_at DESC
      `;
            params = [req.user.id];
        } else {
            query = `
        SELECT lr.*, u.unit_number, p.name AS property_name
        FROM lease_requests lr
        JOIN units u ON lr.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        WHERE lr.tenant_id = (SELECT id FROM tenants WHERE user_id = $1)
        ORDER BY lr.created_at DESC
      `;
            params = [req.user.id];
        }
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
};

// POST /api/lease-requests - Tenant picks a house
const createLeaseRequest = async (req, res, next) => {
    try {
        const { unit_id, message } = req.body;
        const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id = $1', [req.user.id]);
        if (!tenantRes.rows.length) return res.status(403).json({ success: false, message: 'Only tenants can request leases.' });
        const tenant_id = tenantRes.rows[0].id;

        // Check if unit is vacant
        const unit = await pool.query('SELECT status FROM units WHERE id = $1', [unit_id]);
        if (unit.rows[0]?.status !== 'vacant') {
            return res.status(400).json({ success: false, message: 'This unit is not available.' });
        }

        const result = await pool.query(`
      INSERT INTO lease_requests (unit_id, tenant_id, message)
      VALUES ($1, $2, $3) RETURNING *
    `, [unit_id, tenant_id, message]);

        res.status(201).json({ success: true, message: 'Lease request sent to landlord.', data: result.rows[0] });
    } catch (err) { next(err); }
};

// PUT /api/lease-requests/:id/status (Landlord/Admin)
const updateLeaseRequestStatus = async (req, res, next) => {
    try {
        const { status } = req.body; // approved, rejected, cancelled
        const result = await pool.query(`
      UPDATE lease_requests SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [status, req.params.id]);

        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });

        // If approved, landlord can then proceed to create a formal lease (manually or we can automate)
        // For now, just update status.

        res.json({ success: true, message: `Request ${status}.`, data: result.rows[0] });
    } catch (err) { next(err); }
};

module.exports = { getLeaseRequests, createLeaseRequest, updateLeaseRequestStatus };
