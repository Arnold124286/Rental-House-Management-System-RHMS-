const pool = require('../config/db');

const getDashboard = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let data = {};

    if (role === 'admin') {
      const [users, properties, units, payments, maintenance] = await Promise.all([
        pool.query(`SELECT COUNT(*) AS total, role FROM users GROUP BY role`),
        pool.query(`SELECT COUNT(*) AS total FROM properties`),
        pool.query(`SELECT COUNT(*) AS total, status FROM units GROUP BY status`),
        pool.query(`SELECT SUM(amount) AS total FROM payments WHERE payment_month = $1 AND status='confirmed'`, [new Date().toISOString().slice(0,7)]),
        pool.query(`SELECT COUNT(*) AS total FROM maintenance_requests WHERE status IN ('open','in_progress')`),
      ]);
      data = {
        users: users.rows,
        properties: properties.rows[0],
        units: units.rows,
        current_month_revenue: payments.rows[0].total || 0,
        pending_maintenance: maintenance.rows[0].total,
      };

    } else if (role === 'landlord') {
      const landlord = await pool.query('SELECT id FROM landlords WHERE user_id=$1', [userId]);
      const lid = landlord.rows[0]?.id;

      const [props, units, revenue, arrears, maintenance] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM properties WHERE landlord_id=$1`, [lid]),
        pool.query(`SELECT COUNT(*), u.status FROM units u JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 GROUP BY u.status`, [lid]),
        pool.query(`SELECT SUM(py.amount) AS total FROM payments py JOIN leases l ON py.lease_id=l.id JOIN units u ON l.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND py.payment_month=$2 AND py.status='confirmed'`, [lid, new Date().toISOString().slice(0,7)]),
        pool.query(`SELECT COUNT(*) FROM leases l JOIN units u ON l.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND l.status='active' AND l.id NOT IN (SELECT lease_id FROM payments WHERE payment_month=$2 AND status='confirmed')`, [lid, new Date().toISOString().slice(0,7)]),
        pool.query(`SELECT COUNT(*) FROM maintenance_requests mr JOIN units u ON mr.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND mr.status='open'`, [lid]),
      ]);
      data = {
        properties: props.rows[0].count,
        units: units.rows,
        current_month_revenue: revenue.rows[0].total || 0,
        arrears_count: arrears.rows[0].count,
        open_maintenance: maintenance.rows[0].count,
      };

    } else if (role === 'tenant') {
      const tenant = await pool.query('SELECT id FROM tenants WHERE user_id=$1', [userId]);
      const tid = tenant.rows[0]?.id;

      const [lease, payments, maintenance] = await Promise.all([
        pool.query(`SELECT l.*, u.unit_number, p.name AS property_name, p.address FROM leases l JOIN units u ON l.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE l.tenant_id=$1 AND l.status='active' LIMIT 1`, [tid]),
        pool.query(`SELECT * FROM payments py JOIN leases l ON py.lease_id=l.id WHERE l.tenant_id=$1 ORDER BY py.paid_at DESC LIMIT 5`, [tid]),
        pool.query(`SELECT * FROM maintenance_requests WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 5`, [tid]),
      ]);
      data = {
        active_lease: lease.rows[0] || null,
        recent_payments: payments.rows,
        recent_maintenance: maintenance.rows,
      };
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getDashboard };