const API_URL = 'http://localhost:5000/api/v1';

async function run() {
  try {
    console.log('1. Attempting login for Vaibhav...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vaibhav.innonsh@gmail.com',
        password: 'Innonsh@100'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    const loginData: any = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Login successful! Token acquired.');

    console.log('2. Calling notifications generate API...');
    const genRes = await fetch(`${API_URL}/contractor/notifications/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('HTTP Status:', genRes.status);
    const genData = await genRes.json();
    console.log('Response payload:', JSON.stringify(genData, null, 2));
  } catch (err: any) {
    console.error('API execution failed:', err.message || err);
  }
}

run();
