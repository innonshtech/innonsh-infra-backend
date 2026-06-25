const API_URL = 'http://localhost:5000/api/v1';

async function run() {
  try {
    console.log('1. Attempting login to local backend at:', `${API_URL}/auth/login`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aniket.innonsh1@gmail.com',
        password: 'Aniket@25'
      })
    });
    
    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    
    console.log('Login successful!');
    const token = loginData.data.accessToken;
    
    console.log('2. Attempting to add RENTED equipment (matching frontend serialization)...');
    // For Rented: dailyRentalRate is a number, serialNumber is "", assetLifeYears/depreciationMethod are sent (if not reset), other fields are undefined (omitted)
    const rentedPayload = {
      name: 'Volvo EC210 Testing Rented API',
      type: 'Excavator',
      serialNumber: '',
      ownership: 'RENTED',
      dailyRentalRate: 12000,
      assetLifeYears: 10,
      depreciationMethod: 'SLM'
      // other undefined fields (hourlyRate, purchaseCost, purchaseDate, projectId) are omitted
    };

    const rentedRes = await fetch(`${API_URL}/contractor/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(rentedPayload)
    });

    console.log('Rented equipment response status:', rentedRes.status);
    const rentedData = await rentedRes.json();
    console.log('Rented response:', JSON.stringify(rentedData, null, 2));

    console.log('3. Attempting to add OWNED equipment (matching frontend serialization)...');
    // For Owned: purchaseCost is a number, serialNumber is "", assetLifeYears is 10, depreciationMethod is SLM, purchaseDate is string, other fields are undefined
    const ownedPayload = {
      name: 'Volvo EC210 Testing Owned API',
      type: 'Excavator',
      serialNumber: '',
      ownership: 'OWNED',
      purchaseCost: 5000000,
      assetLifeYears: 10,
      depreciationMethod: 'SLM',
      purchaseDate: '2026-06-24'
      // other undefined fields (dailyRentalRate, hourlyRate, projectId) are omitted
    };

    const ownedRes = await fetch(`${API_URL}/contractor/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(ownedPayload)
    });

    console.log('Owned equipment response status:', ownedRes.status);
    const ownedData = await ownedRes.json();
    console.log('Owned response:', JSON.stringify(ownedData, null, 2));

  } catch (err: any) {
    console.error('API call failed!');
    console.error(err.message || err);
  }
}

run();
