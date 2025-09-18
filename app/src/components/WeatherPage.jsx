import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudSun,
  faMapMarkerAlt,
  faInfoCircle,
  faDroplet,
  faTemperatureHigh,
  faTemperatureLow,
  faWind,
  faTachometerAlt,
  faUmbrella,
  faBrain,
  faCloudRain,
  faSeedling,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import WeatherAnalysis from './WeatherAnalysis';

const WeatherPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Weather State
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [activeWeatherView, setActiveWeatherView] = useState('hourly');
  const [weatherError, setWeatherError] = useState(null);
  const [location, setLocation] = useState('');

  // Weather code to description mapping
  const getWeatherDesc = (code) => {
    const map = {
      1000: "Clear",
      1100: "Mostly Clear",
      1101: "Partly Cloudy",
      1102: "Mostly Cloudy",
      1001: "Cloudy",
      2000: "Fog",
      2100: "Light Fog",
      4000: "Drizzle",
      4001: "Rain",
      4200: "Light Rain",
      4201: "Heavy Rain",
      5000: "Snow",
      5001: "Flurries",
      5100: "Light Snow",
      5101: "Heavy Snow",
      6000: "Freezing Drizzle",
      6001: "Freezing Rain",
      6200: "Light Freezing Rain",
      6201: "Heavy Freezing Rain",
      7000: "Ice Pellets",
      7101: "Heavy Ice Pellets",
      7102: "Light Ice Pellets",
      8000: "Thunderstorm",
    };
    return map[code] || "Unknown";
  };

  // Weather code to icon mapping
  const getWeatherIcon = (code) => {
    // Map weather codes to FontAwesome icons
    const iconMap = {
      1000: faCloudSun, // Clear
      1100: faCloudSun, // Mostly Clear
      1101: faCloudSun, // Partly Cloudy
      1102: faCloudSun, // Mostly Cloudy
      1001: faCloudSun, // Cloudy
      2000: faCloudSun, // Fog
      2100: faCloudSun, // Light Fog
      4000: faCloudRain, // Drizzle
      4001: faCloudRain, // Rain
      4200: faCloudRain, // Light Rain
      4201: faCloudRain, // Heavy Rain
      5000: faCloudRain, // Snow
      5001: faCloudRain, // Flurries
      5100: faCloudRain, // Light Snow
      5101: faCloudRain, // Heavy Snow
      6000: faCloudRain, // Freezing Drizzle
      6001: faCloudRain, // Freezing Rain
      6200: faCloudRain, // Light Freezing Rain
      6201: faCloudRain, // Heavy Freezing Rain
      7000: faCloudRain, // Ice Pellets
      7101: faCloudRain, // Heavy Ice Pellets
      7102: faCloudRain, // Light Ice Pellets
      8000: faCloudRain, // Thunderstorm
    };
    return iconMap[code] || faCloudSun;
  };

  // Fetch weather data (using mock data for now, replace with actual API call)
  useEffect(() => {
    const fetchWeatherData = async () => {
      setWeatherLoading(true);
      setWeatherError(null);

      try {
        // Get user location for more accurate weather (can be replaced with stored location)
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;

        // For demonstration, using reverse geocoding to get location name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
        );

        if (response.ok) {
          const locationData = await response.json();
          setLocation(locationData.display_name.split(',').slice(0, 2).join(','));
        }

        // Mock data - replace with actual API call
        const mockWeather = {
          temp: '28°C',
          condition: 'Partly Cloudy',
          desc: 'Partly cloudy conditions with slight chance of rain in the evening',
          humidity: '65%',
          wind: '8 km/h',
          pressure: '1013 hPa',
          time: new Date().toLocaleTimeString(),
          weatherCode: 1101
        };

        const mockHourly = [
          { time: '9 AM', temp: '24°C', icon: faCloudSun, weatherCode: 1000 },
          { time: '10 AM', temp: '26°C', icon: faCloudSun, weatherCode: 1100 },
          { time: '11 AM', temp: '27°C', icon: faCloudSun, weatherCode: 1101 },
          { time: '12 PM', temp: '28°C', icon: faCloudSun, weatherCode: 1101 },
          { time: '1 PM', temp: '29°C', icon: faCloudSun, weatherCode: 1102 },
          { time: '2 PM', temp: '29°C', icon: faCloudRain, weatherCode: 4200 },
        ];

        const mockDaily = [
          { day: 'Mon', high: '29°C', low: '22°C', condition: 'Partly Cloudy', icon: faCloudSun, weatherCode: 1101, precipitation: 0 },
          { day: 'Tue', high: '27°C', low: '21°C', condition: 'Rain', icon: faCloudRain, weatherCode: 4001, precipitation: 12 },
          { day: 'Wed', high: '26°C', low: '20°C', condition: 'Rain', icon: faCloudRain, weatherCode: 4001, precipitation: 8 },
          { day: 'Thu', high: '28°C', low: '21°C', condition: 'Partly Cloudy', icon: faCloudSun, weatherCode: 1101, precipitation: 0 },
          { day: 'Fri', high: '30°C', low: '22°C', condition: 'Sunny', icon: faCloudSun, weatherCode: 1000, precipitation: 0 },
          { day: 'Sat', high: '32°C', low: '23°C', condition: 'Sunny', icon: faCloudSun, weatherCode: 1000, precipitation: 0 },
          { day: 'Sun', high: '31°C', low: '23°C', condition: 'Partly Cloudy', icon: faCloudSun, weatherCode: 1101, precipitation: 0 },
        ];

        setWeather(mockWeather);
        setHourly(mockHourly);
        setDailyForecast(mockDaily);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeatherError('Failed to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Header with back button */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            {t('back_to_dashboard') || 'Back to Dashboard'}
          </button>
          <h1 className="text-2xl font-bold">{t('weather_forecast') || 'Weather Forecast'}</h1>
        </div>

        {/* Main Weather Card */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          {weatherLoading && (
            <div className="flex justify-center p-8">
              <div className="loader" />
            </div>
          )}

          {weatherError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <p>{weatherError}</p>
              </div>
            </div>
          )}

          {/* Current Weather */}
          {weather && !weatherError && !weatherLoading && (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500 mr-2" />
                  <span className="text-gray-500">{location || 'Your Location'}</span>
                </div>
                <h2 className="text-3xl font-bold">{weather.temp}</h2>
                <div className="text-gray-600">{weather.condition}</div>
                <div className="flex flex-col mt-4 text-sm space-y-1">
                  <div className="flex items-center text-blue-600">
                    <FontAwesomeIcon icon={faDroplet} className="mr-2 w-5" />
                    <span>Humidity: {weather.humidity}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 w-5" />
                    <span>Wind: {weather.wind}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 w-5" />
                    <span>Pressure: {weather.pressure}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="text-6xl text-blue-200">
                  <FontAwesomeIcon icon={faCloudSun} />
                </div>
              </div>
            </div>
          )}

          {/* Toggle between hourly and daily forecast */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
            <button
              className={`px-4 py-1 text-sm font-medium ${activeWeatherView === 'hourly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveWeatherView('hourly')}
            >
              {t('hourly') || 'Hourly'}
            </button>
            <button
              className={`px-4 py-1 text-sm font-medium ${activeWeatherView === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveWeatherView('daily')}
            >
              {t('7_day') || '7-Day'}
            </button>
          </div>

          {!weatherLoading && !weatherError && (
            activeWeatherView === 'hourly' ? (
              /* Hourly forecast */
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('today_forecast') || "Today's Forecast"}</h3>
                <div className="flex justify-between overflow-x-auto pb-2">
                  {hourly.map((hour, index) => (
                    <div key={index} className="text-center px-4">
                      <div className="text-sm font-medium text-gray-500">{hour.time}</div>
                      <div className="text-blue-400 my-2">
                        <FontAwesomeIcon icon={hour.icon} />
                      </div>
                      <div className="text-sm font-medium">{hour.temp}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Daily forecast */
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('7_day_forecast') || "7-Day Forecast"}</h3>
                <div className="space-y-3">
                  {dailyForecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium w-16">{day.day}</div>
                      <div className="flex items-center text-blue-500">
                        <FontAwesomeIcon icon={day.icon} />
                      </div>
                      <div className="text-gray-600 text-sm">{day.condition}</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{day.high}</span>
                        <span className="text-gray-400 text-sm">{day.low}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </section>

        {/* Weather-based farming advisory */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faSeedling} className="text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">{t('farming_advisory') || 'Farming Advisory'}</h2>
          </div>

          {/* Static advisory */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-gray-700 mb-4">
            <p className="mb-2"><span className="font-medium">{t('irrigation') || 'Irrigation'}:</span> {t('irrigation_advisory') || 'Based on the forecast, consider light irrigation in the evening as the next two days show partly cloudy conditions.'}</p>
            <p><span className="font-medium">{t('crop_protection') || 'Crop Protection'}:</span> {t('protection_advisory') || 'Rain expected on Tuesday and Wednesday. Consider applying fungicide preventatively to protect crops from potential fungal diseases.'}</p>
          </div>

          {/* Weather Analysis AI Component */}
          <div className="mt-4">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faBrain} className="text-blue-500 mr-2" />
              <h3 className="text-sm font-semibold text-gray-800">{t('ai_weather_analysis') || 'AI Weather Analysis'}</h3>
            </div>
            {weather && dailyForecast.length > 0 ? (
              <WeatherAnalysis
                weather={{
                  temp: weather.temp,
                  desc: weather.desc,
                  humidity: weather.humidity,
                  time: weather.time
                }}
                daily={dailyForecast.map((day, index) => ({
                  time: new Date(Date.now() + (index * 86400000)).toISOString(),
                  values: {
                    temperatureMax: day.high,
                    temperatureMin: day.low,
                    weatherCodeMax: day.weatherCode || (day.condition === 'Rain' ? 2 : day.condition === 'Sunny' ? 0 : 1),
                    precipitationSum: day.precipitation || (day.condition === 'Rain' ? 5 : 0)
                  }
                }))}
                formatDay={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                getWeatherDesc={(code) => {
                  const conditions = ['Sunny', 'Partly Cloudy', 'Rain'];
                  return conditions[code] || 'Unknown';
                }}
              />
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-gray-700">
                <p>{t('weather_loading') || 'Weather data is loading. Please wait...'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Crop-specific weather recommendations */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faSeedling} className="text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">{t('crop_specific_recommendations') || 'Crop-Specific Recommendations'}</h2>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700">
            <p className="mb-3">{t('weather_impact_desc') || 'The weather forecast can affect different crops in different ways. Here are specific recommendations for your crops:'}</p>

            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">{t('rice_crops') || 'Rice Crops'}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('maintain_water_levels') || 'Maintain water levels in paddy fields as temperatures rise mid-week'}</li>
                  <li>{t('monitor_fungal_rain') || 'Monitor for fungal diseases after Tuesday and Wednesday rains'}</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">{t('vegetable_crops') || 'Vegetable Crops'}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('cover_plants_rain') || 'Consider covering tender plants during Tuesday rainfall'}</li>
                  <li>{t('mulch_addition') || 'Add mulch to retain moisture during the hot weekend forecast'}</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">{t('fruit_trees') || 'Fruit Trees'}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('inspect_after_rain') || 'Inspect for pests after rain as they tend to emerge in humid conditions'}</li>
                  <li>{t('prune_after_week') || 'Good conditions for pruning after mid-week when weather dries'}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WeatherPage;