/**
 * Test script for user-specific task generation
 * This simulates what happens when a user visits the site
 */

async function testUserTaskGeneration() {
  try {
    console.log('🧪 Testing user-specific task generation...');

    // Test with a sample user ID (replace with a real user ID from your database)
    const testUserId = '6888e92c7ff14b3bfc90158e';  // Replace with real user ID

    console.log(`🔍 Testing for user: ${testUserId}`);

    // Use dynamic import for fetch in Node.js
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('http://localhost:5000/api/tasks/generate-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        location: 'Test Location',
        diseaseRisks: {}
      })
    });

    const result = await response.json();

    console.log('\n📊 === RESULT ===');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);

    if (result.generated) {
      console.log(`✅ Tasks Generated: ${result.data.taskCount}`);
      console.log(`🌱 Crops Processed: ${result.data.cropResults.length}`);

      result.data.cropResults.forEach(crop => {
        if (!crop.error) {
          console.log(`  - ${crop.cropName}: ${crop.tasksGenerated} tasks (${crop.generationMethod})`);
        }
      });
    } else {
      console.log(`ℹ️ Generation skipped: ${result.existingTaskCount || 0} recent tasks found`);
    }

    console.log('\n🎯 Test completed successfully!');

    // Test again immediately to verify 24-hour limit
    console.log('\n🔁 Testing rate limiting (should skip generation)...');

    const secondResponse = await fetch('http://localhost:5000/api/tasks/generate-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        location: 'Test Location'
      })
    });

    const secondResult = await secondResponse.json();

    console.log(`Second call result: ${secondResult.message}`);
    console.log(`Generated: ${secondResult.generated}`);

    if (!secondResult.generated) {
      console.log('✅ Rate limiting working correctly!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserTaskGeneration();