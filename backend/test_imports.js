try {
    console.log('Testing imports...');
    const db = require('./src/config/db');
    console.log('✅ DB Config loaded');
    const relController = require('./src/controllers/relocationController');
    console.log('✅ Relocation Controller loaded');
    const routes = require('./src/routes/index');
    console.log('✅ Routes Index loaded');
    console.log('All critical modules loaded successfully!');
} catch (err) {
    console.error('❌ Import failed:');
    console.error(err);
    process.exit(1);
}
