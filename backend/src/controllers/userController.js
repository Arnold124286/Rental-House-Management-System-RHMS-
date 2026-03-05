const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// GET /api/users
const getUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        let query = 'SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.is_active, u.created_at FROM users u';
        const params = [];

        if (role === 'landlord') {
            query = `
                SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.is_active, u.created_at,
                       l.id AS landlord_id, l.status, l.business_name, l.phone
                FROM users u
                JOIN landlords l ON u.id = l.user_id
                WHERE u.role = 'landlord'
            `;
        } else if (req.user.role === 'landlord') {
            query += ' WHERE u.role = $1';
            params.push('tenant');
        } else if (role) {
            query += ' WHERE u.role = $1';
            params.push(role);
        }


        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, first_name, last_name, is_active, created_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = result.rows[0];

        // RBAC: Landlords can only see their own tenant profiles.
        if (req.user.role === 'landlord' && user.role !== 'tenant') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
    try {
        const { first_name, last_name, is_active } = req.body;

        const checkResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (!checkResult.rows.length) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const targetUser = checkResult.rows[0];

        // RBAC: Landlords can only update tenants.
        if (req.user.role === 'landlord' && targetUser.role !== 'tenant') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const result = await pool.query(
            `UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, role, first_name, last_name, is_active`,
            [first_name, last_name, is_active, req.params.id]
        );

        res.json({ success: true, message: 'User updated successfully.', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
    try {
        const checkResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (!checkResult.rows.length) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const targetUser = checkResult.rows[0];

        // Only Admin can delete users.
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Permission denied. Only admins can delete users.' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
        next(err);
    }
};

// PUT /api/users/landlord/:id/approve
const approveLandlord = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find the user_id for this landlord
        const landResult = await client.query('SELECT user_id FROM landlords WHERE id = $1', [req.params.id]);
        if (!landResult.rows.length) {
            return res.status(404).json({ success: false, message: 'Landlord profile not found.' });
        }
        const userId = landResult.rows[0].user_id;

        // Generate temporary password
        const tempPassword = crypto.randomBytes(6).toString('hex'); // e.g. 'a1b2c3d4e5f6'
        const hash = await bcrypt.hash(tempPassword, 12);

        // Update user password and landlord status
        await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
        const result = await client.query(
            'UPDATE landlords SET status = \'approved\', updated_at = NOW() WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        await client.query('COMMIT');

        // Return the clear-text password to the admin (simulation: this would ideally be emailed)
        res.json({
            success: true,
            message: 'Landlord approved and credentials generated.',
            data: {
                landlord: result.rows[0],
                generated_password: tempPassword
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};


// PUT /api/users/landlord/:id/blacklist
const blacklistLandlord = async (req, res, next) => {
    try {
        const result = await pool.query(
            'UPDATE landlords SET status = \'blacklisted\', updated_at = NOW() WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Landlord profile not found.' });
        res.json({ success: true, message: 'Landlord blacklisted.', data: result.rows[0] });
    } catch (err) { next(err); }
};

module.exports = { getUsers, getUser, updateUser, deleteUser, approveLandlord, blacklistLandlord };

