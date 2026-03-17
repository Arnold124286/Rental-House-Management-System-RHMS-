const axios = require('axios');

const sendSMS = async (phone, message) => {
    try {
        const apiKey = process.env.UJUMBE_API_KEY;
        const email = process.env.UJUMBE_EMAIL;

        if (!apiKey || !email || apiKey === 'dummy') {
            console.warn('Ujumbe SMS credentials not configured. SMS not sent.');
            return { success: false, message: 'SMS credentials missing' };
        }

        // Format phone to 254XXXXXXXXX
        let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone;
        } else if (formattedPhone.startsWith('+254')) {
            formattedPhone = formattedPhone.replace('+', '');
        }

        const response = await axios.post(
            'https://ujumbesms.co.ke/api/messaging',
            {
                data: [
                    {
                        message_bag: {
                            numbers: formattedPhone,
                            message: message,
                            sender: 'SMARTVISIT' // using a generic or your registered sender id
                        }
                    }
                ]
            },
            {
                headers: {
                    'X-Authorization': apiKey,
                    'email': email,
                    'Content-Type': 'application/json'
                }
            }
        );

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Ujumbe SMS Error:', error.response?.data || error.message);
        return { success: false, error: 'Failed to send SMS' };
    }
};

module.exports = { sendSMS };
