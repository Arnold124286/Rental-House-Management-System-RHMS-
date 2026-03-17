const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
    try {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.EMAIL_FROM;

        if (!user || user === 'dummy@gmail.com') {
            console.warn('SMTP credentials not configured. Email not sent.');
            return { success: false, message: 'SMTP credentials missing' };
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port == 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Nodemailer Error:', error.message);
        return { success: false, error: 'Failed to send Email' };
    }
};

module.exports = { sendEmail };
