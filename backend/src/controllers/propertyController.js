const pool = require('../config/db');

// GET /api/properties
const getProperties = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    if (req.user.role === 'admin') {
      query = `
        SELECT p.*, u.first_name || ' ' || u.last_name AS landlord_name, u.email AS landlord_email,
               COUNT(DISTINCT un.id) AS total_units,
               COUNT(DISTINCT CASE WHEN un.status = 'occupied' THEN un.id END) AS occupied_units,
               COUNT(DISTINCT CASE WHEN un.status = 'vacant' THEN un.id END) AS vacant_units
        FROM properties p
        JOIN landlords l ON p.landlord_id = l.id
        JOIN users u ON l.user_id = u.id
        LEFT JOIN units un ON un.property_id = p.id
        WHERE 1=1
      `;
      params = [];
      if (status) {
        params.push(status);
        query += ` AND p.status = $${params.length}`;
      }
      if (category) {
        params.push(category);
        query += ` AND p.category = $${params.length}`;
      }
      query += ` GROUP BY p.id, u.first_name, u.last_name, u.email ORDER BY p.created_at DESC`;
    } else {
      // Landlord sees only their properties
      query = `
        SELECT p.*, COUNT(DISTINCT un.id) AS total_units,
               COUNT(DISTINCT CASE WHEN un.status = 'occupied' THEN un.id END) AS occupied_units,
               COUNT(DISTINCT CASE WHEN un.status = 'vacant' THEN un.id END) AS vacant_units
        FROM properties p
        JOIN landlords l ON p.landlord_id = l.id
        LEFT JOIN units un ON un.property_id = p.id
        WHERE l.user_id = $1
      `;
      params = [req.user.id];
      if (status) {
        params.push(status);
        query += ` AND p.status = $${params.length}`;
      }
      if (category) {
        params.push(category);
        query += ` AND p.category = $${params.length}`;
      }
      query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};


// GET /api/properties/public (Marketplace)
const publicGetProperties = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT p.*, u.first_name || ' ' || u.last_name AS landlord_name,
             COUNT(DISTINCT un.id) AS total_units,
             COUNT(DISTINCT CASE WHEN un.status = 'vacant' THEN un.id END) AS vacant_units,
             ROUND(AVG(r.rating), 1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM properties p
      JOIN landlords l ON p.landlord_id = l.id
      JOIN users u ON l.user_id = u.id
      LEFT JOIN units un ON un.property_id = p.id
      LEFT JOIN reviews r ON r.property_id = p.id AND r.is_visible = TRUE
      WHERE p.status = 'approved' AND p.is_blacklisted = FALSE
    `;
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }
    query += ` GROUP BY p.id, u.first_name, u.last_name
      HAVING COUNT(DISTINCT CASE WHEN un.status = 'vacant' THEN un.id END) > 0
      ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};


// GET /api/properties/:id
const getProperty = async (req, res, next) => {
  try {
    const propertyRes = await pool.query(`
      SELECT p.*, l.id AS landlord_id, u.first_name || ' ' || u.last_name AS landlord_name,
             ROUND(AVG(r.rating), 1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM properties p 
      JOIN landlords l ON p.landlord_id = l.id 
      JOIN users u ON l.user_id = u.id
      LEFT JOIN reviews r ON r.property_id = p.id AND r.is_visible = TRUE
      WHERE p.id = $1
      GROUP BY p.id, l.id, u.first_name, u.last_name
    `, [req.params.id]);

    if (!propertyRes.rows.length) return res.status(404).json({ success: false, message: 'Property not found.' });

    const units = await pool.query('SELECT * FROM units WHERE property_id = $1 ORDER BY unit_number', [req.params.id]);

    const reviews = await pool.query(`
      SELECT r.*, u.first_name || ' ' || u.last_name AS tenant_name
      FROM reviews r
      JOIN tenants t ON r.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE r.property_id = $1 AND r.is_visible = TRUE
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...propertyRes.rows[0],
        units: units.rows,
        reviews: reviews.rows
      }
    });
  } catch (err) { next(err); }
};

// POST /api/properties
const createProperty = async (req, res, next) => {
  try {
    const { name, address, city, description, category } = req.body;
    const landlord = await pool.query('SELECT id, status FROM landlords WHERE user_id = $1', [req.user.id]);
    if (!landlord.rows.length) return res.status(400).json({ success: false, message: 'Landlord profile not found.' });

    if (landlord.rows[0].status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Your landlord account is pending approval.' });
    }

    const result = await pool.query(`
      INSERT INTO properties (landlord_id, name, address, city, description, status, category)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *
    `, [landlord.rows[0].id, name, address, city, description, category || 'rental']);

    await pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'PROPERTY_CREATED', 'property', $2)`, [req.user.id, result.rows[0].id]);
    res.status(201).json({ success: true, message: 'Property submitted for approval.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/properties/:id/blacklist
const blacklistProperty = async (req, res, next) => {
  try {
    const result = await pool.query(`UPDATE properties SET is_blacklisted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, message: 'Property blacklisted due to poor reviews.', data: result.rows[0] });
  } catch (err) { next(err); }
};


// PUT /api/properties/:id/approve
const approveProperty = async (req, res, next) => {
  try {
    const result = await pool.query(`UPDATE properties SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, message: 'Property appoved successfully.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/properties/:id/reject
const rejectProperty = async (req, res, next) => {
  try {
    const result = await pool.query(`UPDATE properties SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Property rejected.' });
    res.json({ success: true, message: 'Property rejected successfully.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/properties/:id
const updateProperty = async (req, res, next) => {
  try {
    const { name, address, city, description } = req.body;
    const result = await pool.query(`
      UPDATE properties SET name=$1, address=$2, city=$3, description=$4, updated_at=NOW(), status='pending'
      WHERE id=$5 RETURNING *
    `, [name, address, city, description, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, message: 'Property updated and re-submitted for approval.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /api/properties/:id
const deleteProperty = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM properties WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, message: 'Property deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getProperties, getProperty, createProperty, updateProperty, deleteProperty, publicGetProperties, approveProperty, rejectProperty, blacklistProperty };

