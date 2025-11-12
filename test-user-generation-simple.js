const axios = require('axios');

async function testUserGeneration() {
  try {
    console.log('Testing user-specific task generation...');
    
    const response = await axios.post('http://localhost:3001/api/tasks/generate-user', {
      userId: '507f1f77bcf86cd799439011' // Test ObjectId format
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Server Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testUserGeneration();