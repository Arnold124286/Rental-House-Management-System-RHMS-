const axios = require('axios');
async function verify() {
    try {
        const r = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@rhms.com',
            password: 'Admin@2024!'
        });
        console.log('--- VERIFICATION RESULT ---');
        console.log('Login Success:', r.data.success);
        console.log('User Role:', r.data.data.user.role);
        console.log('---------------------------');
    } catch (e) {
        console.error('Login Failed:', e.response?.data || e.message);
        process.exit(1);
    }
}
verify();
