const pool = require('./src/config/db');

(async () => {
  try {
    const lid = await pool.query("SELECT id FROM landlords LIMIT 1").then(r => r.rows[0].id);
    const dateStr = new Date().toISOString().slice(0,7);
    
    console.log("lid:", lid, "date:", dateStr);

    console.log("Props");
    await pool.query(`SELECT COUNT(*) FROM properties WHERE landlord_id=$1`, [lid]);

    console.log("Units");
    await pool.query(`SELECT COUNT(*), status FROM units u JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 GROUP BY status`, [lid]);

    console.log("Revenue");
    await pool.query(`SELECT SUM(py.amount) AS total FROM payments py JOIN leases l ON py.lease_id=l.id JOIN units u ON l.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND py.payment_month=$2 AND py.status='confirmed'`, [lid, dateStr]);

    console.log("Arrears");
    await pool.query(`SELECT COUNT(*) FROM leases l JOIN units u ON l.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND l.status='active' AND l.id NOT IN (SELECT lease_id FROM payments WHERE payment_month=$2 AND status='confirmed')`, [lid, dateStr]);

    console.log("Maintenance");
    await pool.query(`SELECT COUNT(*) FROM maintenance_requests mr JOIN units u ON mr.unit_id=u.id JOIN properties p ON u.property_id=p.id WHERE p.landlord_id=$1 AND mr.status='open'`, [lid]);

    console.log("All success");
  } catch (err) {
    console.error("Failed on query:", err.message);
  } finally {
    pool.end();
  }
})();
