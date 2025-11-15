/**
 * Manual trigger script for task generation
 * Run this to immediately generate tasks for all users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { generateAllUserTaskRecommendations } = require('./utils/taskRecommendationGenerator');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech');
    console.log('✅ MongoDB connected for task generation');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Enhanced helper function to safely get weather data (with fallback)
async function getWeatherDataSafely(location) {
  try {
    // If you have a weather API, implement it here
    // For now, return a basic structure that won't break the system
    return {
      temp: 25, // Default temperature
      humidity: 60,
      daily: [
        {
          time: new Date().toISOString(),
          values: {
            temperatureMax: 28,
            temperatureMin: 18,
            precipitation: 0,
            precipitationProbability: 10
          }
        }
      ]
    };
  } catch (error) {
    console.warn('⚠️  Weather data not available, using defaults:', error.message);
    return { temp: 25, daily: [] };
  }
}

// Main task generation function
async function triggerTaskGeneration() {
  try {
    console.log('🚀 Starting manual task generation...');
    console.log('📅 Current time:', new Date().toISOString());

    // Get all active users
    const users = await User.find().select('_id location');
    console.log(`👥 Found ${users.length} users in the system`);

    if (users.length === 0) {
      console.log('ℹ️  No users found. Make sure users are registered in the system.');
      return;
    }

    let totalTasksGenerated = 0;
    const results = [];

    console.log('\n🔧 Processing task generation for each user...');

    // Generate recommendations for each user
    for (const user of users) {
      try {
        console.log(`\n📋 Generating tasks for user: ${user._id}`);

        // Enhanced options for better task generation
        const enhancedOptions = {
          includeWeatherTasks: true,
          includeGrowthStageTasks: true,
          includeDiseaseTasks: true,
          includeSeasonalTasks: true,
          daysToLookAhead: 7,
          prioritizeUrgentTasks: true,
          weatherData: await getWeatherDataSafely(user.location),
          diseaseRisks: {}
        };

        const result = await generateAllUserTaskRecommendations(user._id, enhancedOptions);
        totalTasksGenerated += result.taskCount;

        const successfulCrops = result.cropResults?.filter(r => !r.error).length || 0;
        const failedCrops = result.cropResults?.filter(r => r.error).length || 0;

        console.log(`  ✅ Generated ${result.taskCount} tasks for ${successfulCrops} crops`);
        if (failedCrops > 0) {
          console.log(`  ⚠️  ${failedCrops} crops failed to generate tasks`);
        }

        results.push({
          userId: user._id,
          taskCount: result.taskCount,
          cropCount: result.cropResults?.length || 0,
          successfulCrops,
          failedCrops,
          summary: result.summary
        });

      } catch (error) {
        console.error(`❌ Error generating tasks for user ${user._id}:`, error.message);
        results.push({
          userId: user._id,
          error: error.message,
          taskCount: 0
        });
      }
    }

    // Final summary
    console.log('\n📊 === TASK GENERATION SUMMARY ===');
    console.log(`🎯 Total tasks generated: ${totalTasksGenerated}`);
    console.log(`👥 Users processed: ${users.length}`);
    console.log(`✅ Successful generations: ${results.filter(r => !r.error).length}`);
    console.log(`❌ Failed generations: ${results.filter(r => r.error).length}`);

    if (totalTasksGenerated > 0) {
      console.log(`📈 Average tasks per user: ${Math.round(totalTasksGenerated / users.length)}`);
    }

    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      if (result.error) {
        console.log(`  ❌ User ${result.userId}: Error - ${result.error}`);
      } else {
        console.log(`  ✅ User ${result.userId}: ${result.taskCount} tasks for ${result.cropCount} crops`);
      }
    });

    console.log('\n🎉 Manual task generation completed successfully!');

  } catch (error) {
    console.error('💥 Error in manual task generation:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the task generation
connectDB().then(triggerTaskGeneration);