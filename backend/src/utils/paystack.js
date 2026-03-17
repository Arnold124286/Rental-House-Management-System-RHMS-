const axios = require('axios');
const crypto = require('crypto');

// Helper to interact with Paystack API
const initializePayment = async (email, amount, reference, lease_id, payment_month, channel = null, channel_meta = {}) => {
    try {
        const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
        if (!secretKey) {
            console.warn('Paystack Secret Key is missing.');
            return { success: false, message: 'Payment gateway configuration error.' };
        }

        const data = {
            email: email,
            amount: amount * 100, // Paystack expects amount in kobo/cents
            reference: reference,
            metadata: {
                lease_id: lease_id,
                payment_month: payment_month,
                ...channel_meta // Include specific details like phone for STK push
            }
        };

        // If a specific channel is selected, we can hint it to Paystack
        // Common channels: ['card', 'bank', 'bank_transfer', 'mobile_money', 'qr', 'ussd']
        if (channel) {
            // Map our frontend IDs to Paystack channel names if necessary
            const channelMap = {
                'mobile_money': 'mobile_money',
                'card': 'card',
                'bank_transfer': 'bank_transfer',
                'apple_pay': 'card', // Paystack handles Apple Pay via card
                'paypal': 'card' // PayPal often handled via card/special or just omitted to show all
            };
            const paystackChannel = channelMap[channel] || channel;
            data.channels = [paystackChannel];
        } else {
            data.channels = ['card', 'bank', 'bank_transfer', 'mobile_money'];
        }

        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            data,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return { success: true, authorizationUrl: response.data.data.authorization_url, data: response.data.data };
    } catch (error) {
        // Detailed logging for debugging
        if (error.response) {
            console.error('Paystack API Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Paystack Network Error:', error.message);
        }
        return { success: false, error: error.response?.data?.message || 'Failed to initialize payment', details: error.response?.data };
    }
};

const verifyWebhookSignature = (req) => {
    const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    return hash === req.headers['x-paystack-signature'];
};

module.exports = { initializePayment, verifyWebhookSignature };
