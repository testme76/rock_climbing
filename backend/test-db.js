import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Server time:', result.rows[0].now);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('\nConnection details:');
    console.error('User:', process.env.DB_USER);
    console.error('Host:', process.env.DB_HOST);
    console.error('Database:', process.env.DB_NAME);
    console.error('Port:', process.env.DB_PORT);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
