const API_URL = 'http://localhost:5000/api/v1';

async function run() {
  try {
    console.log('Attempting login for Vaibhav...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vaibhav.innonsh@gmail.com',
        password: 'Innonsh@100'
      })
    });
    
    console.log('HTTP Status:', loginRes.status);
    const loginData: any = await loginRes.json();
    console.log('Response payload:', JSON.stringify(loginData, null, 2));
  } catch (err: any) {
    console.error('API request failed:', err.message || err);
  }
}

run();
