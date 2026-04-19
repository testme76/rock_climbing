import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting database initialization...');

    // Begin transaction
    await client.query('BEGIN');

    // Read and execute schema.sql
    console.log('Creating tables from schema.sql...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    await client.query(schemaSQL);
    console.log('✓ Tables created successfully');

    // Read and execute seed.sql
    console.log('Inserting seed data from seed.sql...');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8'
    );
    await client.query(seedSQL);
    console.log('✓ Seed data inserted successfully');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Database initialized successfully!');
    console.log('\nYou can now:');
    console.log('  1. Start the backend: npm run dev');
    console.log('  2. Verify data: psql -U postgres -d climbing_tracker');
    console.log('     Then run: SELECT * FROM users;');

  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error initializing database:');
    console.error(err.message);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database "climbing_tracker" exists');
    console.error('  3. Your .env file has correct credentials');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to initialize database');
    process.exit(1);
  });
