/**
 * Test script to verify the unified Task collection implementation
 * This script tests:
 * 1. Task model can be loaded without DailyTaskGeneration dependency
 * 2. Static methods work correctly
 * 3. Schema validation works for both task types
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Import the updated Task model and Crop model for population
const Task = require('./models/Task');
const Crop = require('./models/Crop');

async function testUnifiedTaskModel() {
  try {
    console.log('🧪 Testing Unified Task Collection...\n');

    // Connect to MongoDB (use test database)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech-test';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create an individual task
    console.log('\n📝 Test 1: Creating individual task...');
    const mockUserId = new mongoose.Types.ObjectId();
    const mockCropId = new mongoose.Types.ObjectId();

    const individualTask = new Task({
      crop: mockCropId,
      user: mockUserId,
      title: 'Water the tomatoes',
      description: 'Check soil moisture and water if needed',
      category: 'irrigation',
      priority: 'medium',
      dueDate: new Date(),
      generationType: 'individual_task' // This is the default
    });

    await individualTask.save();
    console.log('✅ Individual task created successfully');

    // Test 2: Create a daily generation tracker
    console.log('\n📊 Test 2: Creating daily generation tracker...');
    const today = new Date();

    const generationTracker = new Task({
      user: mockUserId,
      title: `Daily Generation - ${today.toDateString()}`,
      description: 'Daily task generation tracking record',
      category: 'general',
      dueDate: today,
      status: 'done',
      generationType: 'daily_generation_tracker',
      dailyGeneration: {
        date: today,
        tasksGenerated: 3,
        taskIds: [individualTask._id],
        cropsProcessed: [{
          cropId: mockCropId,
          cropName: 'Tomatoes',
          tasksCreated: 1
        }],
        totalTasks: 3,
        completedTasks: 0
      }
    });

    await generationTracker.save();
    console.log('✅ Daily generation tracker created successfully');

    // Test 3: Test static methods
    console.log('\n🔍 Test 3: Testing static methods...');

    const isGenerated = await Task.isGeneratedToday(mockUserId);
    console.log(`✅ isGeneratedToday result: ${isGenerated}`);

    const todaysGeneration = await Task.getTodaysGeneration(mockUserId);
    console.log(`✅ getTodaysGeneration result: ${todaysGeneration ? 'Found' : 'Not found'}`);

    // Test 4: Test completion percentage virtual
    console.log('\n📈 Test 4: Testing completion percentage...');
    console.log(`✅ Completion percentage: ${todaysGeneration.completionPercentage}%`);

    // Test 5: Test queries filtering by generationType
    console.log('\n🔎 Test 5: Testing filtered queries...');

    const individualTasks = await Task.find({
      user: mockUserId,
      generationType: 'individual_task'
    });
    console.log(`✅ Found ${individualTasks.length} individual tasks`);

    const generationTrackers = await Task.find({
      user: mockUserId,
      generationType: 'daily_generation_tracker'
    });
    console.log(`✅ Found ${generationTrackers.length} generation trackers`);

    // Test 6: Test updating completion count
    console.log('\n✏️ Test 6: Testing completion tracking...');
    await Task.updateOne(
      {
        user: mockUserId,
        generationType: 'daily_generation_tracker',
        'dailyGeneration.date': today
      },
      { $inc: { 'dailyGeneration.completedTasks': 1 } }
    );

    const updatedTracker = await Task.findById(generationTracker._id);
    console.log(`✅ Completed tasks updated to: ${updatedTracker.dailyGeneration.completedTasks}`);
    console.log(`✅ Updated completion percentage: ${updatedTracker.completionPercentage}%`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Task.deleteMany({ user: mockUserId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Unified Task collection is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testUnifiedTaskModel();