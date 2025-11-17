/**
 * Chat Route - Farming Assistant Chatbot
 * 
 * This route handles chat messages and uses Gemini API for NLU and function calling
 * to convert natural language into backend API calls.
 */

const express = require('express');
const auth = require('../middleware/auth');
// Use dynamic import for fetch since node-fetch v3 is ESM only
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// All routes require authentication
router.use(auth);



/**
 * Simple system prompt for basic farming assistant
 */
const SYSTEM_PROMPT = `You are a helpful farming assistant. Provide practical agricultural advice and help farmers manage their crops. Be friendly, knowledgeable, and give actionable suggestions.

When users ask to perform actions and you have all required information, respond in this format:
ACTION: action_name(parameter1, parameter2)
Then provide your response.

Available actions:
- ADD_CROP(actual_crop_name, actual_variety) - Add a new crop (example: ADD_CROP(tomato, cherry))
- REMOVE_CROP(actual_crop_name) - Remove an existing crop (example: REMOVE_CROP(tomato))
- LIST_CROPS() - Show all crops
- GET_WEATHER(actual_location) - Get weather for specific location (example: GET_WEATHER(Mumbai))

IMPORTANT: Only use ACTION format when you have the actual specific information. If users ask to add a crop but don't specify which crop, ask them what crop they want to add instead of using ACTION format.`;

/**
 * Execute backend API calls based on detected actions
 */
async function executeAction(action, userId, authToken) {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:5000';

  try {
    // Parse action
    const actionMatch = action.match(/([A-Z_]+)\(([^)]*)\)/);
    if (!actionMatch) return null;

    const [, actionName, paramsStr] = actionMatch;
    const params = paramsStr.split(',').map(p => p.trim().replace(/["']/g, '')).filter(Boolean);

    switch (actionName) {
      case 'ADD_CROP':
        if (!params[0]) {
          return { success: false, message: '🌱 Please specify which crop you want to add. For example: "Add tomato crop" or "Add rice variety basmati"', requiresInput: true };
        }
        return await addCropAPI(params[0], params[1], userId, authToken, baseURL);
      case 'REMOVE_CROP':
        if (!params[0]) {
          return { success: false, message: '🗑️ Please specify which crop you want to remove. For example: "Remove tomato crop"', requiresInput: true };
        }
        return await removeCropAPI(params[0], userId, authToken, baseURL);
      case 'LIST_CROPS':
        return await listCropsAPI(userId, authToken, baseURL);
      case 'GET_WEATHER':
        return await getWeatherAPI(params[0], userId, authToken, baseURL);
      default:
        return null;
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return { success: false, message: 'Failed to execute action: ' + error.message };
  }
}

/**
 * API call functions
 */
async function addCropAPI(cropName, variety, userId, authToken, baseURL) {
  if (!cropName || cropName.trim() === '') {
    return { success: false, message: '🌱 Please specify which crop you want to add. For example: "Add tomato" or "Add rice variety basmati"', requiresInput: true };
  }

  // Capitalize first letter of crop name and variety
  const formattedCropName = cropName.trim().charAt(0).toUpperCase() + cropName.trim().slice(1).toLowerCase();
  const formattedVariety = variety && variety.trim() ?
    variety.trim().charAt(0).toUpperCase() + variety.trim().slice(1).toLowerCase() : null;

  const cropData = {
    name: formattedCropName,
    ...(formattedVariety && { variety: formattedVariety }),
    plantingDate: new Date().toISOString().split('T')[0],
    status: 'Growing'
  };

  const response = await fetch(`${baseURL}/api/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(cropData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Add crop API error:', errorData);
    throw new Error(`Failed to add crop: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    success: true,
    message: `✅ Successfully added ${formattedCropName}${formattedVariety ? ` (${formattedVariety})` : ''} to your farm! Planted on ${new Date().toLocaleDateString()}.\n\n🌱 Remember to water regularly and monitor for pests.`,
    data: result
  };
}

async function removeCropAPI(cropName, userId, authToken, baseURL) {
  if (!cropName) return { success: false, message: 'Crop name is required' };

  // Get crops to find the one to delete
  const cropsResponse = await fetch(`${baseURL}/api/crops`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!cropsResponse.ok) {
    throw new Error('Failed to fetch crops');
  }

  const crops = await cropsResponse.json();
  const cropToDelete = crops.find(crop =>
    crop.name.toLowerCase().includes(cropName.toLowerCase())
  );

  if (!cropToDelete) {
    return {
      success: false,
      message: `❌ Could not find a crop named "${cropName}" in your farm.\nAvailable crops: ${crops.map(c => c.name).join(', ') || 'None'}`
    };
  }

  const deleteResponse = await fetch(`${baseURL}/api/crops/${cropToDelete._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!deleteResponse.ok) {
    throw new Error(`Failed to remove crop: ${deleteResponse.statusText}`);
  }

  return {
    success: true,
    message: `✅ Successfully removed ${cropToDelete.name} from your farm.`
  };
}

async function listCropsAPI(userId, authToken, baseURL) {
  const response = await fetch(`${baseURL}/api/crops`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch crops: ${response.statusText}`);
  }

  const crops = await response.json();

  if (crops.length === 0) {
    return {
      success: true,
      message: "📋 You don't have any crops planted yet. Would you like to add some?",
      data: []
    };
  }

  const cropList = crops.map((crop, index) =>
    `${index + 1}. ${crop.name}${crop.variety ? ` (${crop.variety})` : ''} - Status: ${crop.status}${crop.plantingDate ? `, Planted: ${new Date(crop.plantingDate).toLocaleDateString()}` : ''}`
  ).join('\n');

  return {
    success: true,
    message: `📋 You have ${crops.length} crop(s) on your farm:\n\n${cropList}`,
    data: crops
  };
}

async function getWeatherAPI(location, userId, authToken, baseURL) {
  if (!location || location.trim() === '') {
    return {
      success: false,
      message: "🌤️ I'd be happy to get weather information for you! Please specify a location. For example: 'What's the weather in Delhi?' or 'Get weather for Mumbai'",
      requiresInput: true
    };
  }

  // For now, return mock weather data
  // In a real implementation, you would integrate with a weather API
  const mockWeatherData = {
    location: location,
    temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    conditions: ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain'][Math.floor(Math.random() * 4)],
    precipitation: Math.floor(Math.random() * 30),
    forecast: [
      { day: 'Today', high: 28, low: 18, conditions: 'Sunny' },
      { day: 'Tomorrow', high: 26, low: 17, conditions: 'Partly cloudy' },
      { day: 'Day after', high: 24, low: 16, conditions: 'Light rain' }
    ]
  };

  const forecastText = mockWeatherData.forecast.map(f =>
    `${f.day}: ${f.conditions}, High: ${f.high}°C, Low: ${f.low}°C`
  ).join('\n');

  return {
    success: true,
    message: `🌤️ Weather for ${mockWeatherData.location}:\n\nCurrent: ${mockWeatherData.conditions}, ${mockWeatherData.temperature}°C, Humidity: ${mockWeatherData.humidity}%\n\nForecast:\n${forecastText}\n\n🌱 Farming tip: ${getFarmingTip(mockWeatherData)}`,
    data: mockWeatherData
  };
}

/**
 * Generate farming tips based on weather conditions
 */
function getFarmingTip(weatherData) {
  if (weatherData.conditions.includes('rain')) {
    return 'Good time for planting! Ensure proper drainage for existing crops.';
  } else if (weatherData.temperature > 30) {
    return 'High temperatures - increase watering frequency and provide shade for sensitive plants.';
  } else if (weatherData.humidity < 50) {
    return 'Low humidity - consider mulching to retain soil moisture.';
  } else {
    return 'Favorable conditions for most farming activities!';
  }
}



/**
 * Chat endpoint with simple action detection and execution
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user._id;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured. Please contact administrator.'
      });
    }

    // Create simple prompt like other working examples
    const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${message}\n\nRespond with helpful farming advice. If the user wants to perform an action, include the ACTION: format in your response.`;

    // Use same pattern as other working Gemini calls in the codebase
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, response.statusText, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!geminiText) {
      throw new Error('Empty response from AI service');
    }

    let finalMessage = geminiText;
    let actionResult = null;

    // Check if Gemini suggested an action
    const actionMatch = geminiText.match(/ACTION:\s*([^\n]+)/);
    if (actionMatch) {
      const actionString = actionMatch[1].trim();
      console.log('Detected action:', actionString);

      // Execute the action
      actionResult = await executeAction(actionString, userId, authToken);

      if (actionResult) {
        // Replace the ACTION line with the result
        finalMessage = geminiText.replace(/ACTION:\s*[^\n]+/, actionResult.message);

        if (!actionResult.success) {
          finalMessage += '\n\n💡 You can also use the navigation menu to manage your crops manually.';
        }
      }
    } else {
      // If no action detected, check for common patterns and suggest actions
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('add') && lowerMessage.includes('crop')) {
        // Try to detect specific crop name, but if none found, ask for it
        const cropNamePatterns = [
          /add\s+([a-zA-Z]+)(?:\s+crop)?/i,  // "add tomato" or "add tomato crop"
          /add\s+(?:a\s+)?(\w+)(?:\s+variety)?/i, // "add a tomato" or "add tomato variety"
          /plant\s+(\w+)/i, // "plant tomato"
          /grow\s+(\w+)/i   // "grow tomato"
        ];

        let cropName = null;
        for (const pattern of cropNamePatterns) {
          const match = message.match(pattern);
          if (match && match[1] && !['a', 'an', 'the', 'crop', 'new', 'some'].includes(match[1].toLowerCase())) {
            cropName = match[1];
            break;
          }
        }

        if (cropName) {
          actionResult = await executeAction(`ADD_CROP(${cropName})`, userId, authToken);
          if (actionResult) {
            finalMessage += '\n\n' + actionResult.message;
          }
        } else {
          // User wants to add a crop but didn't specify which one
          actionResult = await executeAction('ADD_CROP()', userId, authToken);
          if (actionResult && !actionResult.success) {
            finalMessage += '\n\n' + actionResult.message;
          }
        }
      } else if (lowerMessage.includes('list') && lowerMessage.includes('crop')) {
        actionResult = await executeAction('LIST_CROPS()', userId, authToken);
        if (actionResult && actionResult.success) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('remove') && lowerMessage.includes('crop')) {
        const cropNamePatterns = [
          /remove\s+([a-zA-Z]+)(?:\s+crop)?/i,  // "remove tomato" or "remove tomato crop"  
          /delete\s+([a-zA-Z]+)/i, // "delete tomato"
          /remove\s+(?:the\s+)?(\w+)/i // "remove the tomato"
        ];

        let cropName = null;
        for (const pattern of cropNamePatterns) {
          const match = message.match(pattern);
          if (match && match[1] && !['a', 'an', 'the', 'crop', 'my'].includes(match[1].toLowerCase())) {
            cropName = match[1];
            break;
          }
        }

        if (cropName) {
          actionResult = await executeAction(`REMOVE_CROP(${cropName})`, userId, authToken);
        } else {
          // User wants to remove a crop but didn't specify which one
          actionResult = await executeAction('REMOVE_CROP()', userId, authToken);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      } else if (lowerMessage.includes('weather')) {
        // Try to extract location from the message
        let location = null;
        const locationPatterns = [
          /weather\s+(?:in|for|at)\s+([\w\s]+)/i,
          /(?:in|for|at)\s+([\w\s]+)\s+weather/i,
          /weather\s+([\w\s]{3,})/i
        ];

        for (const pattern of locationPatterns) {
          const match = message.match(pattern);
          if (match) {
            location = match[1].trim();
            break;
          }
        }

        if (location) {
          actionResult = await executeAction(`GET_WEATHER(${location})`, userId, authToken);
        } else {
          actionResult = await executeAction('GET_WEATHER()', userId, authToken);
        }

        if (actionResult) {
          finalMessage += '\n\n' + actionResult.message;
        }
      }
    }

    res.json({
      success: true,
      message: finalMessage.trim(),
      conversationId: `${userId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...(actionResult && { actionExecuted: true, actionResult })
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Provide helpful fallback message
    const fallbackMessage = "I'm your farming assistant! While I'm having some technical difficulties, you can still use the navigation menu to manage your crops, check weather, view market prices, and more. How can I help you with farming advice?";

    res.status(200).json({
      success: true,
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

/**
 * Get chat history endpoint (for future implementation)
 */
router.get('/history/:conversationId?', async (req, res) => {
  try {
    // For now, return empty history
    // In a full implementation, you would store and retrieve conversation history
    res.json({
      success: true,
      history: [],
      message: 'Chat history feature coming soon!'
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
});

module.exports = router;