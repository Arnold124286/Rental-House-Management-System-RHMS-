const pool = require('../config/db');

// GET /api/reviews/:propertyId
const getPropertyReviews = async (req, res, next) => {
    try {
        const result = await pool.query(`
      SELECT r.*, u.first_name || ' ' || u.last_name AS tenant_name
      FROM reviews r
      JOIN tenants t ON r.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE r.property_id = $1 AND r.is_visible = TRUE
      ORDER BY r.created_at DESC
    `, [req.params.propertyId]);
        res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
};

// POST /api/reviews
const createReview = async (req, res, next) => {
    try {
        const { property_id, rating, comment } = req.body;

        // Get tenant ID from user ID
        const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id = $1', [req.user.id]);
        if (!tenantRes.rows.length) return res.status(403).json({ success: false, message: 'Only tenants can leave reviews.' });
        const tenant_id = tenantRes.rows[0].id;

        // Check if tenant has a lease at this property
        const leaseCheck = await pool.query(`
      SELECT l.id FROM leases l
      JOIN units u ON l.unit_id = u.id
      WHERE l.tenant_id = $1 AND u.property_id = $2
    `, [tenant_id, property_id]);

        if (!leaseCheck.rows.length) {
            return res.status(403).json({ success: false, message: 'You can only review properties where you have stayed.' });
        }

        const result = await pool.query(`
      INSERT INTO reviews (property_id, tenant_id, rating, comment)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [property_id, tenant_id, rating, comment]);

        res.status(201).json({ success: true, message: 'Review submitted.', data: result.rows[0] });
    } catch (err) { next(err); }
};

// DELETE /api/reviews/:id (Admin only)
const deleteReview = async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Review not found.' });
        res.json({ success: true, message: 'Review deleted.' });
    } catch (err) { next(err); }
};

module.exports = { getPropertyReviews, createReview, deleteReview };
