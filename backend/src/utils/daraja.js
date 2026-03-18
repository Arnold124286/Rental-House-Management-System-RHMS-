const axios = require('axios');

/**
 * Utility for Safaricom Daraja API (M-Pesa)
 */

const isLive = () => process.env.DARAJA_ENV === 'live';
const DARAJA_BASE = () => isLive()
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const getAccessToken = async () => {
    try {
        const consumerKey = process.env.DARAJA_CONSUMER_KEY;
        const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
            throw new Error('Daraja Consumer Key or Secret is missing.');
        }

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const response = await axios.get(
            `${DARAJA_BASE()}/oauth/v1/generate?grant_type=client_credentials`,
            { headers: { Authorization: `Basic ${auth}` } }
        );

        return response.data.access_token;
    } catch (error) {
        console.error('Daraja Auth Error:', error.response?.data || error.message);
        throw error;
    }
};

const stkPush = async (phone, amount, lease_id, payment_type = 'rent') => {
    try {
        const accessToken = await getAccessToken();
        const shortCode = process.env.DARAJA_SHORTCODE || '174379';
        const passkey = process.env.DARAJA_PASSKEY;
        const callbackUrl = process.env.DARAJA_CALLBACK_URL;

        if (!passkey || !callbackUrl) {
            throw new Error('Daraja Passkey or Callback URL is missing.');
        }

        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        // Normalize phone number to 254...
        let formattedPhone = phone.replace(/\+/g, '').replace(/^0/, '254');
        if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone;
        }

        const data = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `RHMS_${lease_id.substring(0, 5)}`,
            TransactionDesc: `RHMS ${payment_type}`
        };

        const response = await axios.post(
            `${DARAJA_BASE()}/mpesa/stkpush/v1/processrequest`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Daraja STK Push Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.CustomerMessage || 'STK Push failed' };
    }
};

module.exports = { stkPush };
