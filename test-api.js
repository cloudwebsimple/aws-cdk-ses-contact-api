const API_URL = 'https://dhqmedbto5.execute-api.us-east-1.amazonaws.com/prod/contact';

const testData = {
  name: 'Test User',
  email: 'test@example.com',
  message: 'This is 2nd test message from the contact form API'
};

async function testAPI() {
  try {
    console.log('Testing Contact API...');
    console.log('URL:', API_URL);
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ API test successful!');
    } else {
      console.log('❌ API test failed');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();