const http = require('http');

const request = (options, data) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (d) => { body += d; });
            res.on('end', () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, body: parsedBody });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

async function run() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Admin Login
        console.log('1. Logging in as Admin...');
        const loginRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'admin@rhms.com', password: 'Admin@2024!' });

        if (loginRes.statusCode !== 200) throw new Error('Admin login failed');
        const adminToken = loginRes.body.data.token;
        console.log('   ✅ Admin logged in.');

        // 2. Admin Creates Landlord
        console.log('2. Admin creating Landlord...');
        const createLandlordRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
        }, {
            username: 'verifylandlord', email: 'verify_landlord@rhms.com', password: 'Password@123',
            role: 'landlord', first_name: 'Verify', last_name: 'Landlord'
        });

        if (createLandlordRes.statusCode !== 201) {
            console.log('   ❌ Error:', createLandlordRes.body);
            throw new Error('Landlord creation failed');
        }
        console.log('   ✅ Landlord created.');

        // 3. Landlord Login
        console.log('3. Logging in as new Landlord...');
        const lLoginRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'verify_landlord@rhms.com', password: 'Password@123' });

        if (lLoginRes.statusCode !== 200) throw new Error('Landlord login failed');
        const landlordToken = lLoginRes.body.data.token;
        console.log('   ✅ Landlord logged in.');

        // 4. Landlord Creates Tenant
        console.log('4. Landlord creating Tenant...');
        const createTenantRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${landlordToken}` }
        }, {
            username: 'verifytenant', email: 'verify_tenant@rhms.com', password: 'Password@123',
            role: 'tenant', first_name: 'Verify', last_name: 'Tenant'
        });

        if (createTenantRes.statusCode !== 201) {
            console.log('   ❌ Error:', createTenantRes.body);
            throw new Error('Tenant creation failed');
        }
        console.log('   ✅ Tenant created.');

        // 5. Tenant Login
        console.log('5. Logging in as new Tenant...');
        const tLoginRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'verify_tenant@rhms.com', password: 'Password@123' });

        if (tLoginRes.statusCode !== 200) throw new Error('Tenant login failed');
        console.log('   ✅ Tenant logged in.');

        console.log('--- VERIFICATION SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(err.message);
        process.exit(1);
    }
}

run();
