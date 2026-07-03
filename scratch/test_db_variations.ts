import pg from 'pg';

const passwords = ['Innonshinfra%40100', 'Innonsh%40100', 'Infrainnonsh%40100', 'Innonshinfra100'];
const host = 'db.igcgsalyqsidrpxrrcgm.supabase.co';

async function testPasswords() {
  console.log('--- START PASSWORD VARIATION TESTS ---');
  for (const pw of passwords) {
    const url = `postgresql://postgres:${pw}@${host}:5432/postgres`;
    console.log(`Testing password: ${pw}`);
    const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      console.log(`🎉 SUCCESS! Connected successfully with password variation: ${pw}`);
      client.release();
      await pool.end();
      return;
    } catch (err: any) {
      console.log(`Failed: ${err.message}`);
      await pool.end();
    }
  }
  console.log('All tested variations failed.');
}
testPasswords();
