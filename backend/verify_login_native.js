const http = require('http');

const data = JSON.stringify({
    email: 'admin@rhms.com',
    password: 'Admin@2024!',
    worker_id: 'RHMS-ST-001'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
        console.log('--- VERIFICATION RESULT ---');
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', body);
        console.log('---------------------------');
        if (res.statusCode === 200 && body.includes('"success":true')) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('Login Failed:', error.message);
    process.exit(1);
});

req.write(data);
req.end();
