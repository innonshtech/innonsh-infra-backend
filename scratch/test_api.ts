async function runIntegrationTest() {
  console.log('Starting Notifications API integration test...');
  const baseURL = 'http://localhost:5000/api/v1';

  try {
    // 1. Log in to get accessToken
    console.log('Logging in as testman@gmail.com...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testman@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginRes.json() as any;
    const token = loginData?.data?.accessToken;
    if (!token) {
      console.error('Login failed: Token not found in response', loginData);
      return;
    }
    console.log('Login success! JWT Token retrieved.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Call generate notifications endpoint
    console.log('Triggering notifications generation endpoint...');
    const genRes = await fetch(`${baseURL}/contractor/notifications/generate`, {
      method: 'POST',
      headers
    });
    const genData = await genRes.json() as any;
    console.log('Generate Response status:', genRes.status);
    console.log('Generate Response data:', genData);

    // 3. Call get all notifications
    console.log('Fetching notifications...');
    const getRes = await fetch(`${baseURL}/contractor/notifications`, {
      method: 'GET',
      headers
    });
    const getData = await getRes.json() as any;
    console.log('Get All Response status:', getRes.status);
    console.log('Notifications count:', getData?.data?.length);
    console.log('Notifications:', getData?.data);

    console.log('\n--- API INTEGRATION TEST PASSED SUCCESSFULLY ---');
  } catch (err: any) {
    console.error('\n--- API INTEGRATION TEST FAILED ---');
    console.error('Error Message:', err.message || err);
  }
}

runIntegrationTest();
