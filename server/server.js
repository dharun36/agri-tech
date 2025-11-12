const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
// node-fetch v3 is ESM only - either use import or downgrade to v2
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { createServer } = require('http');
const { Server } = require('socket.io');
const schedule = require('node-schedule');

// Load environment variables from .env in server folder
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"], // Multiple frontend URLs
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io available to routes
app.set('io', io);

// Health check endpoint for client-side connection testing
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/disease', require('./routes/disease'));
app.use('/api/activities', require('./routes/activities'));
// Market prices proxy
app.use('/api/market', require('./routes/market'));
// Use optimized task routes when specified in environment, otherwise use regular routes
if (process.env.USE_OPTIMIZED_ROUTES === 'true') {
  console.log('Using optimized task routes');
  app.use('/api/tasks', require('./routes/optimizedTasks'));
} else {
  app.use('/api/tasks', require('./routes/tasks'));
}

// User-specific task generation (triggered when user visits site)
app.post('/api/tasks/generate-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log(`Task generation requested for user: ${userId}`);
    
    // Check if user has tasks generated recently (within last 24 hours)
    const Task = require('./models/Task');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentTasks = await Task.find({
      user: userId,
      createdAt: { $gte: twentyFourHoursAgo },
      source: { $in: ['ai_generated', 'system_generated'] }
    });

    // If user has recent tasks, don't generate new ones
    if (recentTasks.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Recent tasks found, no generation needed',
        existingTaskCount: recentTasks.length,
        generated: false
      });
    }

    // Enhanced options for single-user generation
    const enhancedOptions = {
      includeWeatherTasks: true,
      includeGrowthStageTasks: true,
      includeDiseaseTasks: true,
      includeSeasonalTasks: true,
      daysToLookAhead: 7,
      prioritizeUrgentTasks: true,
      weatherData: await getWeatherDataSafely(req.body.location),
      diseaseRisks: req.body.diseaseRisks || {}
    };

    const result = await generateAllUserTaskRecommendations(userId, enhancedOptions);

    console.log(`Generated ${result.taskCount} tasks for user ${userId}`);

    res.status(200).json({
      success: true,
      message: `Generated ${result.taskCount} tasks for ${result.cropResults.length} crops`,
      data: result,
      generated: true
    });

  } catch (error) {
    console.error('Error in user-specific task generation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tasks',
      error: error.message,
      generated: false
    });
  }
});

// Trigger task generation for all users (admin endpoint)
app.post('/api/tasks/generate-all-users', async (req, res) => {
  try {
    console.log('Manual task generation triggered for all users');
    
    // Get all active users
    const users = await User.find().select('_id location');
    let totalTasksGenerated = 0;
    const results = [];

    for (const user of users) {
      try {
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
        results.push({
          userId: user._id,
          taskCount: result.taskCount,
          cropCount: result.cropResults.length
        });
      } catch (error) {
        console.error(`Error generating tasks for user ${user._id}:`, error.message);
        results.push({
          userId: user._id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${totalTasksGenerated} tasks across ${users.length} users`,
      totalTasks: totalTasksGenerated,
      userResults: results
    });

  } catch (error) {
    console.error('Error in bulk task generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tasks for all users',
      error: error.message
    });
  }
});

app.post('/api/weather-analysis', async (req, res) => {
  try {
    const { weatherData } = req.body;

    const prompt = `Given the following weather data, provide comprehensive farming advice including irrigation recommendations. Return ONLY a JSON object with these fields: "advice", "disease_risk", "recommendations", "precautions", "irrigation_advice", "soil_moisture_tips", "watering_schedule". 

    Weather data: ${JSON.stringify(weatherData)}

    Provide specific irrigation advice based on:
    - Current temperature and humidity
    - Expected rainfall in coming days
    - Soil moisture considerations
    - Optimal watering times
    - Water conservation tips`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error('Failed to get AI analysis');
    }

    const data = await geminiResponse.json();
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let result = null;
    try {
      result = JSON.parse(geminiText);
    } catch {
      // fallback: try to extract JSON from the response
      const match = geminiText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
        } catch {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('No valid JSON found in response');
      }
    }

    if (result && result.advice) {
      res.json(result);
    } else {
      throw new Error('Invalid analysis format');
    }
  } catch (error) {
    console.error('Weather analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze weather' });
  }
});

app.get('/', (req, res) => res.send('AgriTech Simple API Running'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for targeted alerts
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handler middleware - must be after all routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Process-level error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error(error.stack);
  // In production, you might want to restart the server or perform cleanup here
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to restart the server or perform cleanup here
});

// Import task recommendation generator
const { generateAllUserTaskRecommendations } = require('./utils/taskRecommendationGenerator');
const User = require('./models/User');

// DISABLED: Schedule daily task recommendation generation to prevent rate limits
// Only generate tasks when users actually visit the site
// 
// schedule.scheduleJob('0 5 * * *', async function () {
//   console.log('Running scheduled daily task recommendation generation...');

//   try {
//     // Get all active users
//     const users = await User.find().select('_id location');

//     let totalTasksGenerated = 0;

//     // Generate recommendations for each user
//     for (const user of users) {
//       try {
//         // Enhanced options for better task generation
//         const enhancedOptions = {
//           includeWeatherTasks: true,
//           includeGrowthStageTasks: true,
//           includeDiseaseTasks: true,
//           includeSeasonalTasks: true,
//           daysToLookAhead: 7,
//           prioritizeUrgentTasks: true,
//           weatherData: await getWeatherDataSafely(user.location), // Safely get weather data
//           diseaseRisks: {} // Could be enhanced with disease detection API
//         };

//         const result = await generateAllUserTaskRecommendations(user._id, enhancedOptions);
//         totalTasksGenerated += result.taskCount;
//         console.log(`Generated ${result.taskCount} tasks for user ${user._id} (${result.cropResults.length} crops)`);
//       } catch (error) {
//         console.error(`Error generating tasks for user ${user._id}:`, error.message);
//       }
//     }

//     console.log(`Daily task generation complete. Generated ${totalTasksGenerated} tasks across ${users.length} users.`);
    
//     // Log completion with timestamp for monitoring
//     console.log(`Task generation completed at: ${new Date().toISOString()}`);
//   } catch (error) {
//     console.error('Error in scheduled task generation:', error);
//   }
// });

// Helper function to safely get weather data (with fallback)
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
    console.warn('Weather data not available, using defaults:', error.message);
    return { temp: 25, daily: [] };
  }
}

const PORT = process.env.PORT || 5000;
// Bind host explicitly so PaaS port scans detect the listening socket
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));
// If a frontend build exists in ../app/dist or ../app/dist, serve it (SPA fallback)
const fs = require('fs');
const pathStatic = require('path');
const possibleBuildDirs = [pathStatic.join(__dirname, '..', 'app', 'dist'), pathStatic.join(__dirname, '..', 'app', 'build'), pathStatic.join(__dirname, '..', 'app', 'dist')];
const existing = possibleBuildDirs.find(d => fs.existsSync(d));
if (existing) {
  console.log('Serving frontend from', existing);
  app.use(express.static(existing));
  // SPA fallback: return index.html for any unknown GET route
  app.get('*', (req, res) => {
    const indexPath = pathStatic.join(existing, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return res.status(404).send('Not found');
  });
}

