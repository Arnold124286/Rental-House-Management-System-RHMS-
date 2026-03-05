const pool = require('../config/db');

// GET /api/units?property_id=xxx&status=vacant
const getUnits = async (req, res, next) => {
  try {
    const { property_id, status } = req.query;
    let query = `
      SELECT u.*, p.name AS property_name,
             t.id AS tenant_id,
             usr.first_name || ' ' || usr.last_name AS tenant_name
      FROM units u
      JOIN properties p ON u.property_id = p.id
      LEFT JOIN leases l ON l.unit_id = u.id AND l.status = 'active'
      LEFT JOIN tenants t ON l.tenant_id = t.id
      LEFT JOIN users usr ON t.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];

    if (property_id) { params.push(property_id); query += ` AND u.property_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND u.status = $${params.length}`; }
    query += ' ORDER BY u.unit_number';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/units/:id
const getUnit = async (req, res, next) => {
  try {
    const unit = await pool.query(`
      SELECT u.*, p.name AS property_name
      FROM units u JOIN properties p ON u.property_id = p.id WHERE u.id = $1
    `, [req.params.id]);

    if (!unit.rows.length) return res.status(404).json({ success: false, message: 'Unit not found.' });

    const activeLease = await pool.query(`
      SELECT l.*, t.phone, usr.first_name || ' ' || usr.last_name AS tenant_name, usr.email AS tenant_email
      FROM leases l JOIN tenants t ON l.tenant_id = t.id JOIN users usr ON t.user_id = usr.id
      WHERE l.unit_id = $1 AND l.status = 'active' LIMIT 1
    `, [req.params.id]);

    const maintenance = await pool.query(
      `SELECT * FROM maintenance_requests WHERE unit_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...unit.rows[0], active_lease: activeLease.rows[0] || null, recent_maintenance: maintenance.rows } });
  } catch (err) { next(err); }
};

// POST /api/units
const createUnit = async (req, res, next) => {
  try {
    const { property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, description, video_url, video_type } = req.body;
    const result = await pool.query(`
      INSERT INTO units (property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, description, video_url, video_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [property_id, unit_number, floor_number, bedrooms, bathrooms, rent_amount, description, video_url, video_type || 'youtube']);


    // Update total_units count
    await pool.query('UPDATE properties SET total_units = (SELECT COUNT(*) FROM units WHERE property_id=$1) WHERE id=$1', [property_id]);

    res.status(201).json({ success: true, message: 'Unit created.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/units/:id
const updateUnit = async (req, res, next) => {
  try {
    const { unit_number, floor_number, bedrooms, bathrooms, rent_amount, status, description, video_url, video_type } = req.body;
    const result = await pool.query(`
      UPDATE units SET unit_number=$1, floor_number=$2, bedrooms=$3, bathrooms=$4,
      rent_amount=$5, status=$6, description=$7, video_url=$8, video_type=$9, updated_at=NOW() WHERE id=$10 RETURNING *
    `, [unit_number, floor_number, bedrooms, bathrooms, rent_amount, status, description, video_url, video_type, req.params.id]);


    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Unit not found.' });
    res.json({ success: true, message: 'Unit updated.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /api/units/:id
const deleteUnit = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM units WHERE id=$1 RETURNING id, property_id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Unit not found.' });
    await pool.query('UPDATE properties SET total_units = (SELECT COUNT(*) FROM units WHERE property_id=$1) WHERE id=$1', [result.rows[0].property_id]);
    res.json({ success: true, message: 'Unit deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getUnits, getUnit, createUnit, updateUnit, deleteUnit };