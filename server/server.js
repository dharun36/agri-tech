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
// Use optimized task routes when specified in environment, otherwise use regular routes
if (process.env.USE_OPTIMIZED_ROUTES === 'true') {
  console.log('Using optimized task routes');
  app.use('/api/tasks', require('./routes/optimizedTasks'));
} else {
  app.use('/api/tasks', require('./routes/tasks'));
}

// Weather Analysis Endpoint using Gemini AI
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

// Schedule daily task recommendation generation for all users at 5:00 AM
schedule.scheduleJob('0 5 * * *', async function () {
  console.log('Running scheduled task recommendation generation...');

  try {
    // Get all active users
    const users = await User.find().select('_id');

    let totalTasksGenerated = 0;

    // Generate recommendations for each user
    for (const user of users) {
      try {
        const result = await generateAllUserTaskRecommendations(user._id);
        totalTasksGenerated += result.taskCount;
        console.log(`Generated ${result.taskCount} tasks for user ${user._id}`);
      } catch (error) {
        console.error(`Error generating tasks for user ${user._id}:`, error);
      }
    }

    console.log(`Daily task generation complete. Generated ${totalTasksGenerated} tasks across ${users.length} users.`);
  } catch (error) {
    console.error('Error in scheduled task generation:', error);
  }
});

const PORT = process.env.PORT || 5000;
// Bind host explicitly so PaaS port scans detect the listening socket
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));

