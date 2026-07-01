const API_URL = 'http://localhost:5000/api/v1';

async function testDelete() {
  try {
    console.log('1. Logging in as Vaibhav Thorat...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vaibhav.innonsh@gmail.com',
        password: 'Innonsh@100'
      })
    });
    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.data.accessToken;
    console.log('Logged in successfully!');

    console.log('2. Fetching all estimations...');
    const estRes = await fetch(`${API_URL}/contractor/estimations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const estData: any = await estRes.json();
    const estimations = estData.data || [];
    console.log(`Found ${estimations.length} estimations.`);

    if (estimations.length === 0) {
      console.log('No estimations to test with. Exiting.');
      return;
    }

    const firstEst = estimations[0];
    console.log(`Selected estimation ID: ${firstEst.id}`);

    // Add a draft item first
    console.log('3. Adding test item...');
    const addRes = await fetch(`${API_URL}/contractor/estimations/${firstEst.id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        description: 'Temporary Test Item for Deletion',
        quantity: 10,
        unit: 'NOS',
        rate: 150
      })
    });
    const addData: any = await addRes.json();
    console.log('Add response:', addRes.status, JSON.stringify(addData));
    
    if (!addRes.ok) {
      throw new Error('Failed to add test item');
    }

    // Now let's fetch the estimation details to get the item ID
    console.log('4. Fetching estimation details to get item list...');
    const detailRes = await fetch(`${API_URL}/contractor/estimations/${firstEst.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const detailData: any = await detailRes.json();
    const latestVersion = detailData.data?.versions?.[0] || detailData.versions?.[0];
    if (!latestVersion) {
      throw new Error('No versions found for this estimation');
    }
    const items = latestVersion.items || [];
    console.log(`Latest version status: ${latestVersion.status}. Number of items: ${items.length}`);

    const testItem = items.find((i: any) => i.description === 'Temporary Test Item for Deletion');
    if (!testItem) {
      console.log('Items in version:', items);
      throw new Error('Could not find the added test item in estimation details');
    }
    console.log(`Found test item with ID: ${testItem.id}`);

    // Attempting delete
    console.log('5. Deleting the test item...');
    const deleteRes = await fetch(`${API_URL}/contractor/estimations/${firstEst.id}/items/${testItem.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Delete response status:', deleteRes.status);
    const deleteData = await deleteRes.json();
    console.log('Delete response body:', JSON.stringify(deleteData, null, 2));

  } catch (err: any) {
    console.error('Test failed with error:', err.message || err);
  }
}

testDelete();
