import pool from './connections.js';

const testDB = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to DB at:', res.rows[0].now);
    process.exit();
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
};

testDB();