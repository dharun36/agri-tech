const { MongoClient } = require('mongodb');

async function testTaskIntegration() {
  console.log('🧪 Testing Task Generation and Display Integration...\n');

  // Test connection to MongoDB
  try {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/AgriTech');
    await client.connect();
    console.log('✅ MongoDB connection successful');

    const db = client.db();

    // Test 1: Check if tasks collection exists and has some tasks
    const tasksCount = await db.collection('tasks').countDocuments();
    console.log(`📊 Total tasks in database: ${tasksCount}`);

    // Test 2: Check recent tasks (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = await db.collection('tasks').find({
      createdAt: { $gte: sevenDaysAgo }
    }).toArray();

    console.log(`📈 Recent tasks (last 7 days): ${recentTasks.length}`);

    if (recentTasks.length > 0) {
      console.log('📝 Recent task examples:');
      recentTasks.slice(0, 3).forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} (${task.category}) - ${task.source || 'manual'}`);
      });
    }

    // Test 3: Check AI-generated tasks
    const aiTasks = await db.collection('tasks').find({
      source: { $in: ['ai_generated', 'system_generated'] }
    }).toArray();

    console.log(`🤖 AI-generated tasks: ${aiTasks.length}`);

    // Test 4: Check today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await db.collection('tasks').find({
      dueDate: { $gte: today, $lt: tomorrow }
    }).toArray();

    console.log(`📅 Today's tasks: ${todayTasks.length}`);

    // Test 5: Check task categories
    const taskCategories = await db.collection('tasks').distinct('category');
    console.log(`🏷️  Task categories: ${taskCategories.join(', ')}`);

    // Test 6: Check user task distribution
    const userTaskCounts = await db.collection('tasks').aggregate([
      {
        $group: {
          _id: '$user',
          taskCount: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log(`👥 Users with tasks: ${userTaskCounts.length}`);
    if (userTaskCounts.length > 0) {
      console.log('   Task distribution:');
      userTaskCounts.forEach(user => {
        console.log(`     User ${user._id}: ${user.taskCount} tasks`);
      });
    }

    await client.close();
    console.log('\n✅ Task integration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTaskIntegration();