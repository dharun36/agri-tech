const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config({ path: './config.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/disease', require('./routes/disease'));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

