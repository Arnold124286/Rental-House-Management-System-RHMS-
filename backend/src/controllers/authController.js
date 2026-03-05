const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  const { username, email, password, role, first_name, last_name, phone, national_id, business_name } = req.body;
  const client = await pool.connect();
  try {
    let hash = '';
    if (role === 'landlord') {
      // Landlords get system-generated passwords on approval
      hash = await bcrypt.hash('PENDING_APPROVAL_' + Math.random(), 12);
    } else {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }
      hash = await bcrypt.hash(password, 12);
    }


    await client.query('BEGIN');

    const userRes = await client.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, first_name, last_name, created_at
    `, [username, email, hash, role || 'tenant', first_name, last_name]);

    const user = userRes.rows[0];

    // Create profile based on role
    if (user.role === 'landlord') {
      await client.query(
        'INSERT INTO landlords (user_id, phone, national_id, business_name, status) VALUES ($1, $2, $3, $4, \'pending\')',
        [user.id, phone, national_id, business_name]
      );

    } else if (user.role === 'tenant') {
      await client.query(
        'INSERT INTO tenants (user_id, phone, national_id) VALUES ($1, $2, $3)',
        [user.id, phone, national_id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user);
    res.status(201).json({ success: true, message: 'Account created successfully.', data: { user, token } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, worker_id } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Admin security refinement: Validate Workers ID
    if (user.role === 'admin') {
      if (!worker_id || user.worker_id !== worker_id) {
        return res.status(401).json({ success: false, message: 'Invalid Workers ID.' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }


    // Log the login
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, ip_address) VALUES ($1, 'USER_LOGIN', 'user', $2)`,
      [user.id, req.ip]
    );

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ success: true, message: 'Login successful.', data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json({ success: true, data: { user: req.user } });
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, result.rows[0].password_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };