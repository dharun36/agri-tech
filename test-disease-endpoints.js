// Simple test script to check disease reporting endpoints
console.log('Testing disease reporting endpoints...\n');

// Test 1: Check if backend server is responding
async function testBackendHealth() {
  try {
    const response = await fetch('http://localhost:5000/api/crops');
    console.log('✅ Backend server (Node.js) is running on port 5000');
    return true;
  } catch (error) {
    console.log('❌ Backend server not responding:', error.message);
    return false;
  }
}

// Test 2: Check disease reporting endpoint
async function testDiseaseReport() {
  try {
    const testData = {
      disease: 'Test Disease',
      description: 'This is a test report',
      location: {
        type: 'Point',
        coordinates: [80.2707, 13.0827] // Chennai coordinates
      },
      locationType: 'current'
    };

    console.log('Testing disease report endpoint...');
    const response = await fetch('http://localhost:5000/api/disease/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.text();

    if (response.ok) {
      console.log('✅ Disease reporting endpoint works');
      console.log('Response:', result);
      return true;
    } else {
      console.log('❌ Disease reporting failed with status:', response.status);
      console.log('Error:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ Disease reporting error:', error.message);
    return false;
  }
}

// Test 3: Check FastAPI disease detection
async function testDiseaseDetection() {
  try {
    const response = await fetch('http://127.0.0.1:8000/ping');
    console.log('✅ FastAPI server is running on port 8000');
    return true;
  } catch (error) {
    console.log('❌ FastAPI server not responding on port 8000:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Disease Detection & Reporting Test ===\n');

  const backendOk = await testBackendHealth();
  console.log();

  if (backendOk) {
    await testDiseaseReport();
  }
  console.log();

  await testDiseaseDetection();

  console.log('\n=== Test Summary ===');
  console.log('Next steps:');
  console.log('1. If backend is not running: start with "node server.js" in D:\\AgriTech\\server');
  console.log('2. If FastAPI not running: start with "python main.py" in D:\\AgriTech\\image-based-ident-api');
  console.log('3. Check browser console for specific errors when using disease detection page');
}

// Use Node.js fetch (requires Node.js 18+) or implement with axios
if (typeof fetch === 'undefined') {
  console.log('This script requires Node.js 18+ with fetch support, or install node-fetch');
  process.exit(1);
}

runTests().catch(error => {
  console.error('Test failed:', error);
});