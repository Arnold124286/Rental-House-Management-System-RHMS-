const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const { initializePayment, verifyWebhookSignature } = require('../utils/paystack');
const { sendSMS } = require('../utils/sms');
const { sendEmail } = require('../utils/email');

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { lease_id, month, year } = req.query;
    let query = `
      SELECT pay.*, l.rent_amount AS monthly_rent, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE user_id=$1', [req.user.id]);
      if (tenantRes.rows.length) {
        params.push(tenantRes.rows[0].id);
        query += ` AND t.id = $${params.length}`;
      }
    } else if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    if (lease_id) { params.push(lease_id); query += ` AND pay.lease_id = $${params.length}`; }
    if (month && year) {
      params.push(`${year}-${String(month).padStart(2, '0')}`);
      query += ` AND pay.payment_month = $${params.length}`;
    }

    query += ' ORDER BY pay.paid_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /api/payments - Record a payment
const createPayment = async (req, res, next) => {
  try {
    const { lease_id, amount, method, transaction_ref, payment_month, notes } = req.body;

    // Validate lease exists
    const lease = await pool.query('SELECT * FROM leases WHERE id=$1 AND status=$2', [lease_id, 'active']);
    if (!lease.rows.length) return res.status(404).json({ success: false, message: 'Active lease not found.' });

    const result = await pool.query(`
      INSERT INTO payments (lease_id, amount, method, transaction_ref, payment_month, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [lease_id, amount, method || 'cash', transaction_ref, payment_month, notes]);

    await pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1,'PAYMENT_RECORDED','payment',$2)`, [req.user.id, result.rows[0].id]);
    res.status(201).json({ success: true, message: 'Payment recorded.', data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/payments/summary - Financial summary
const getPaymentSummary = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let landlordFilter = '';
    const params = [targetYear + '%'];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      landlordFilter = `AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const monthly = await pool.query(`
      SELECT payment_month, SUM(amount) AS total, COUNT(*) AS count
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE pay.payment_month LIKE $1 AND pay.status = 'confirmed' ${landlordFilter}
      GROUP BY payment_month ORDER BY payment_month
    `, params);

    const totals = await pool.query(`
      SELECT SUM(amount) AS total_collected,
             COUNT(*) AS total_payments
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE pay.payment_month LIKE $1 AND pay.status = 'confirmed' ${landlordFilter}
    `, params);

    res.json({ success: true, data: { monthly: monthly.rows, ...totals.rows[0] } });
  } catch (err) { next(err); }
};

// GET /api/payments/arrears
const getArrears = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let query = `
      SELECT l.id AS lease_id, l.rent_amount, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name, usr.email AS tenant_email, t.phone
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE l.status = 'active'
      AND l.id NOT IN (
        SELECT lease_id FROM payments WHERE payment_month = $1 AND status = 'confirmed'
      )
    `;
    const params = [currentMonth];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, month: currentMonth });
  } catch (err) { next(err); }
};

// POST /api/payments/paystack/initialize - Trigger Paystack Checkout
const initializePaystack = async (req, res, next) => {
  try {
    const { lease_id, amount, payment_month, notes, channel, channel_meta } = req.body;

    if (!amount || !lease_id || !payment_month) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get tenant email
    const tenantRes = await pool.query(`
      SELECT usr.email 
      FROM leases l 
      JOIN tenants t ON l.tenant_id = t.id 
      JOIN users usr ON t.user_id = usr.id 
      WHERE l.id = $1 AND l.status = 'active'
    `, [lease_id]);

    if (!tenantRes.rows.length) return res.status(404).json({ success: false, message: 'Active lease not found.' });
    if (!tenantRes.rows[0].email) return res.status(400).json({ success: false, message: 'Tenant email required for Paystack.' });

    const email = tenantRes.rows[0].email;
    const reference = `PS_${lease_id.substring(0, 8)}_${Date.now()}`;

    // Initiate Paystack
    const paystackRes = await initializePayment(email, amount, reference, lease_id, payment_month, channel, channel_meta);

    if (paystackRes.success) {
      // Create pending payment record
      await pool.query(`
        INSERT INTO payments (lease_id, amount, method, transaction_ref, payment_month, notes, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [lease_id, amount, 'paystack', reference, payment_month, notes, 'pending']);

      return res.json({ success: true, message: 'Payment initialized.', data: paystackRes.data });
    } else {
      console.error('Payment initialization failed:', paystackRes.error);
      return res.status(400).json({ success: false, message: paystackRes.error || 'Payment initialization failed' });
    }
  } catch (err) { next(err); }
};

// POST /api/payments/paystack/webhook - Paystack Webhook
const paystackWebhook = async (req, res, next) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(400).send('Invalid Signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amountPaid = data.amount / 100;
      const receiptNo = data.receipt_number || data.id.toString();

      await pool.query(`
          UPDATE payments SET status = 'confirmed', transaction_ref = $1, notes = $2 
          WHERE transaction_ref = $3 AND status = 'pending'
      `, [receiptNo, `Paystack Success (${data.channel || 'unknown'})`, reference]);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Paystack Webhook error:', err);
    res.status(500).send('Server Error');
  }
};

// POST /api/payments/remind - Send SMS/Email Reminders
const sendReminder = async (req, res, next) => {
  try {
    const { lease_id, type } = req.body; // type = 'sms' or 'email'

    const query = `
      SELECT usr.email, usr.first_name, usr.last_name, t.phone, l.rent_amount,
             p.name AS property_name, u.unit_number
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [lease_id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Lease not found.' });

    const tenant = result.rows[0];
    const amount = Number(tenant.rent_amount).toLocaleString();
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    if (type === 'sms') {
      if (!tenant.phone) return res.status(400).json({ success: false, message: 'Tenant has no phone number.' });

      const message = `Hello ${tenant.first_name}, this is a reminder from management that your rent of KES ${amount} for ${month} at ${tenant.property_name} (${tenant.unit_number}) is due. Please clear to avoid inconvenience.`;
      const smsRes = await sendSMS(tenant.phone, message);

      if (smsRes.success) return res.json({ success: true, message: 'SMS Reminder sent.' });
      else return res.status(500).json({ success: false, message: smsRes.error || 'Failed to send SMS.' });

    } else if (type === 'email') {
      if (!tenant.email) return res.status(400).json({ success: false, message: 'Tenant has no email address.' });

      const subject = `Rent Payment Reminder - ${month}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Rent Payment Reminder</h2>
            <p>Dear ${tenant.first_name} ${tenant.last_name},</p>
            <p>This is a gentle reminder that your rent payment for <strong>${month}</strong> is currently due.</p>
            <ul>
                <li><strong>Property:</strong> ${tenant.property_name}</li>
                <li><strong>Unit:</strong> ${tenant.unit_number}</li>
                <li><strong>Amount Due:</strong> KES ${amount}</li>
            </ul>
            <p>Please log in to your dashboard to make the payment.</p>
            <p>Thank you,<br/>Management</p>
        </div>
      `;
      const emailRes = await sendEmail(tenant.email, subject, html);

      if (emailRes.success) return res.json({ success: true, message: 'Email Reminder sent.' });
      else return res.status(500).json({ success: false, message: emailRes.error || 'Failed to send Email.' });

    } else {
      return res.status(400).json({ success: false, message: 'Invalid reminder type.' });
    }
  } catch (err) { next(err); }
};

// POST /api/payments/remind-bulk - Send Bulk SMS Reminders
const sendBulkReminders = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const displayMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    let query = `
      SELECT l.id AS lease_id, l.rent_amount, u.unit_number, p.name AS property_name,
             usr.first_name, t.phone
      FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE l.status = 'active'
      AND l.id NOT IN (
        SELECT lease_id FROM payments WHERE payment_month = $1 AND status = 'confirmed'
      )
    `;
    const params = [currentMonth];

    if (req.user.role === 'landlord') {
      params.push(req.user.id);
      query += ` AND p.landlord_id = (SELECT id FROM landlords WHERE user_id = $${params.length})`;
    }

    const result = await pool.query(query, params);
    const arrears = result.rows;

    if (!arrears.length) {
      return res.json({ success: true, message: 'No tenants in arrears found.' });
    }

    let successCount = 0;
    let failureCount = 0;

    // Send SMS sequentially or concurrently based on provider limits. Sequential here:
    for (const tenant of arrears) {
      if (tenant.phone) {
        const amount = Number(tenant.rent_amount).toLocaleString();
        const message = `Hello ${tenant.first_name}, this is an automated reminder that your rent of KES ${amount} for ${displayMonth} at ${tenant.property_name} (${tenant.unit_number}) is due. Please clear as soon as possible.`;
        const smsRes = await sendSMS(tenant.phone, message);
        if (smsRes.success) successCount++;
        else failureCount++;
      } else {
        failureCount++;
      }
    }

    res.json({ success: true, message: `Bulk reminders complete. Sent: ${successCount}, Failed: ${failureCount}.` });
  } catch (err) { next(err); }
};

// GET /api/payments/:id/receipt
const downloadReceipt = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const query = `
      SELECT pay.*, l.rent_amount, u.unit_number, p.name AS property_name,
             usr.first_name || ' ' || usr.last_name AS tenant_name, usr.email
      FROM payments pay
      JOIN leases l ON pay.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON l.tenant_id = t.id
      JOIN users usr ON t.user_id = usr.id
      WHERE pay.id = $1 AND pay.status = 'confirmed'
    `;
    const result = await pool.query(query, [paymentId]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Confirmed payment not found.' });
    }

    const P = result.rows[0];

    // Create a PDF Document
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${P.payment_month}-${P.unit_number}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center', underline: true });
    doc.moveDown();

    // Summary
    doc.fontSize(12)
      .text(`Receipt Date: ${new Date().toLocaleDateString()}`)
      .text(`Payment Date: ${new Date(P.paid_at).toLocaleDateString()}`)
      .text(`Receipt No: ${P.transaction_ref || P.id.substring(0, 8)}`)
      .moveDown();

    // Tenant info
    doc.fontSize(14).text('Billed To:');
    doc.fontSize(12)
      .text(P.tenant_name)
      .text(P.email)
      .moveDown();

    // Details table
    doc.fontSize(14).text('Payment Details:');
    doc.fontSize(12)
      .text(`Property: ${P.property_name}`)
      .text(`Unit: ${P.unit_number}`)
      .text(`Month: ${P.payment_month}`)
      .text(`Payment Method: ${P.method.replace('_', ' ').toUpperCase()}`)
      .moveDown();

    // Amount
    doc.fontSize(16).text(`Amount Paid: KES ${Number(P.amount).toLocaleString()}`, { bold: true });

    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for your payment!', { align: 'center', italic: true });

    doc.end();
  } catch (err) { next(err); }
};

module.exports = { getPayments, createPayment, getPaymentSummary, getArrears, initializePaystack, paystackWebhook, sendReminder, sendBulkReminders, downloadReceipt };