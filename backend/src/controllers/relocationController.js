const pool = require('../config/db');

// GET /api/relocations
const getRelocations = async (req, res, next) => {
    try {
        let query = `
            SELECT r.*, t.user_id, u.first_name || ' ' || u.last_name AS tenant_name,
                   un1.unit_number AS current_unit, p1.name AS current_property,
                   un2.unit_number AS target_unit, p2.name AS target_property
            FROM relocation_requests r
            JOIN tenants t ON r.tenant_id = t.id
            JOIN users u ON t.user_id = u.id
            JOIN units un1 ON r.current_unit_id = un1.id
            JOIN properties p1 ON un1.property_id = p1.id
            JOIN units un2 ON r.target_unit_id = un2.id
            JOIN properties p2 ON un2.property_id = p2.id
        `;
        const params = [];

        if (req.user.role === 'landlord') {
            query += ` WHERE p1.landlord_id = (SELECT id FROM landlords WHERE user_id = $1) `;
            params.push(req.user.id);
        } else if (req.user.role === 'tenant') {
            query += ` WHERE t.user_id = $1 `;
            params.push(req.user.id);
        }

        query += ' ORDER BY r.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
};

// POST /api/relocations
const createRelocationRequest = async (req, res, next) => {
    try {
        const { target_unit_id, reason } = req.body;

        // Get tenant and their current unit
        const tenantRes = await pool.query(`
            SELECT t.id, l.unit_id 
            FROM tenants t 
            JOIN leases l ON t.id = l.tenant_id 
            WHERE t.user_id = $1 AND l.status = 'active'
        `, [req.user.id]);

        if (!tenantRes.rows.length) {
            return res.status(403).json({ success: false, message: 'Only tenants with an active lease can request relocation.' });
        }

        const { id: tenant_id, unit_id: current_unit_id } = tenantRes.rows[0];

        const result = await pool.query(`
            INSERT INTO relocation_requests (tenant_id, current_unit_id, target_unit_id, reason)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [tenant_id, current_unit_id, target_unit_id, reason]);

        res.status(201).json({ success: true, message: 'Relocation request submitted.', data: result.rows[0] });
    } catch (err) { next(err); }
};

// PUT /api/relocations/:id/status
const updateRelocationStatus = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { status, admin_notes } = req.body;
        await client.query('BEGIN');

        const requestRes = await client.query('SELECT * FROM relocation_requests WHERE id = $1', [req.params.id]);
        if (!requestRes.rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });

        const request = requestRes.rows[0];

        if (status === 'approved') {
            // 1. Terminate current lease
            await client.query(`
                UPDATE leases SET status = 'terminated', end_date = NOW(), updated_at = NOW()
                WHERE tenant_id = $1 AND unit_id = $2 AND status = 'active'
            `, [request.tenant_id, request.current_unit_id]);

            // 2. Mark old unit as vacant
            await client.query('UPDATE units SET status = \'vacant\' WHERE id = $1', [request.current_unit_id]);

            // 3. Create new lease for the target unit
            await client.query(`
                INSERT INTO leases (unit_id, tenant_id, start_date, rent_amount, status)
                SELECT $1, $2, NOW(), rent_amount, 'active' FROM units WHERE id = $1
            `, [request.target_unit_id, request.tenant_id]);

            // 4. Mark new unit as occupied
            await client.query('UPDATE units SET status = \'occupied\' WHERE id = $1', [request.target_unit_id]);
        }

        const result = await client.query(`
            UPDATE relocation_requests 
            SET status = $1, admin_notes = $2, updated_at = NOW() 
            WHERE id = $3 RETURNING *
        `, [status, admin_notes, req.params.id]);

        await client.query('COMMIT');
        res.json({ success: true, message: `Relocation request ${status}.`, data: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// POST /api/relocations/:id/refund
const processRefund = async (req, res, next) => {
    try {
        const { amount, reason } = req.body;

        const requestRes = await pool.query('SELECT * FROM relocation_requests WHERE id = $1', [req.params.id]);
        if (!requestRes.rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });

        const request = requestRes.rows[0];

        // Find the most recent lease for this tenant and current unit to attach refund
        const leaseRes = await pool.query('SELECT id FROM leases WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1', [request.tenant_id]);
        const lease_id = leaseRes.rows.length ? leaseRes.rows[0].id : null;

        if (!lease_id) return res.status(400).json({ success: false, message: 'No lease found to attach refund to.' });

        // Record refund as negative payment
        const refundAmount = -Math.abs(amount);
        const paymentMonth = new Date().toISOString().slice(0, 7);

        await pool.query(`
            INSERT INTO payments (lease_id, amount, method, payment_month, notes, status)
            VALUES ($1, $2, 'cash', $3, $4, 'confirmed')
        `, [lease_id, refundAmount, paymentMonth, `Refund: ${reason}`]);

        // Log refund
        await pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,'REFUND_PROCESSED','relocation_request',$2, $3)`,
            [req.user.id, request.id, JSON.stringify({ amount, reason })]);

        res.json({ success: true, message: `Refund of ${amount} processed successfully.` });
    } catch (err) { next(err); }
};

module.exports = { getRelocations, createRelocationRequest, updateRelocationStatus, processRefund };
