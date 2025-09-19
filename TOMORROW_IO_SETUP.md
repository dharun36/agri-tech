# Tomorrow.io Weather API Setup

This guide will help you set up the Tomorrow.io API for the enhanced weather features in your AgriTech application.

## Prerequisites

1. A Tomorrow.io account (free tier available)
2. Node.js and npm installed
3. Your AgriTech application running

## Step 1: Get Tomorrow.io API Key

1. Visit [Tomorrow.io](https://www.tomorrow.io/)
2. Sign up for a free account
3. Go to the [API Keys section](https://app.tomorrow.io/)
4. Create a new API key
5. Copy your API key

## Step 2: Configure Environment Variables

Create a `.env` file in the `app` directory with the following content:

```env
# Tomorrow.io API Configuration
VITE_TOMORROW_API_KEY=your_tomorrow_io_api_key_here

# Gemini AI API Configuration (for weather analysis)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Weather API Configuration (fallback)
VITE_WEATHER_API_KEY=your_weather_api_key_here
```

Replace `your_tomorrow_io_api_key_here` with your actual Tomorrow.io API key.

## Step 3: Restart the Application

After adding the environment variables:

1. Stop your development server (Ctrl+C)
2. Restart it with `npm run dev`
3. Navigate to `/weather` to see the enhanced weather features

## Features Included

The new Tomorrow.io weather page includes:

- **Real-time Weather Data**: Current temperature, humidity, wind speed, pressure, UV index
- **Hourly Forecast**: 24-hour detailed weather forecast
- **7-Day Forecast**: Extended weather outlook
- **Weather Insights**: UV index, wind conditions, precipitation probability
- **AI Weather Analysis**: Smart farming recommendations based on weather
- **Location Detection**: Automatic location-based weather data
- **Refresh Functionality**: Manual weather data refresh
- **Responsive Design**: Works on desktop and mobile devices

## API Endpoints Used

The implementation uses the following Tomorrow.io API endpoints:

- **Forecast API**: `/v4/weather/forecast`
- **Timesteps**: `1h` (hourly) and `1d` (daily)
- **Fields**: temperature, weatherCode, precipitationIntensity, humidity, windSpeed, windDirection, pressureSurfaceLevel, visibility, cloudCover, uvIndex, temperatureApparent, precipitationProbability

## Troubleshooting

### Common Issues

1. **"Tomorrow.io API key not found" error**
   - Make sure you've created the `.env` file in the `app` directory
   - Verify the API key is correct
   - Restart the development server after adding the environment variable

2. **Weather data not loading**
   - Check your internet connection
   - Verify the API key is valid and has sufficient quota
   - Check the browser console for error messages

3. **Location permission denied**
   - Allow location access in your browser
   - The app needs location access to provide accurate weather data

### API Quota

- Free tier: 100 calls per day
- Paid tiers: Higher limits available
- Monitor your usage in the Tomorrow.io dashboard

## Support

For issues related to:
- Tomorrow.io API: Contact Tomorrow.io support
- Application bugs: Check the console for error messages
- Setup issues: Verify environment variables and API key

## Next Steps

After setting up Tomorrow.io:

1. Test the weather page at `/weather`
2. Verify all features are working correctly
3. Consider upgrading to a paid plan for higher API limits
4. Customize the weather analysis prompts for your specific farming needs
