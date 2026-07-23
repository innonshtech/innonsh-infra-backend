import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

const testCases = [
  { version: 'v1beta', model: 'gemini-1.5-flash' },
  { version: 'v1', model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-2.5-flash' },
  { version: 'v1', model: 'gemini-2.5-flash' },
  { version: 'v1beta', model: 'gemini-2.0-flash' },
  { version: 'v1', model: 'gemini-2.0-flash' }
];

async function runTests() {
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not defined in the environment.');
    return;
  }
  
  console.log('Testing Key:', apiKey.substring(0, 8) + '...\n');

  for (const tc of testCases) {
    console.log(`=== Testing API Version: ${tc.version}, Model: ${tc.model} ===`);
    const url = `https://generativelanguage.googleapis.com/${tc.version}/models/${tc.model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: "Hello" }]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Status Code:', response.status);
      const text = await response.text();
      
      if (response.ok) {
        console.log('SUCCESS! Reply received.');
        const parsed = JSON.parse(text);
        console.log('AI text:', parsed.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + '...');
        break; // Stop on first success!
      } else {
        console.log('FAILED.');
        try {
          const parsed = JSON.parse(text);
          console.log('Error Message:', parsed.error?.message || text);
        } catch {
          console.log('Error Body:', text);
        }
      }
    } catch (err: any) {
      console.log('Request error:', err.message);
    }
    console.log('-----------------------------------------\n');
  }
}

runTests();
