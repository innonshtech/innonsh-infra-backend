import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Testing direct PG connection...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('Successfully connected to PG!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    client.release();
  } catch (err: any) {
    console.error('Connection failed!');
    console.error('Error Name:', err.name);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Error Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

run();
