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
  faArrowLeft,
  faEye,
  faSun,
  faCloud,
  faExclamationTriangle,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchWeatherData,
  getWeatherDesc,
  getWeatherIcon,
  formatHour,
  formatDay
} from '../utils/weatherUtils';
import WeatherAnalysis from './WeatherAnalysis';

const TomorrowWeatherPage = () => {
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
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch weather data from Tomorrow.io API
  useEffect(() => {
    const fetchWeatherData = async () => {
      setWeatherLoading(true);
      setWeatherError(null);

      try {
        // Get user location
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;

        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          
          if (response.ok) {
            const data = await response.json();
            setLocation(data.display_name.split(',').slice(0, 2).join(','));
          } else {
            setLocation('Your Location');
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocation('Your Location');
        }

        // Fetch weather data from Tomorrow.io using existing configuration
        const weatherData = await fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY);
        
        setWeather(weatherData.weather);
        setHourly(weatherData.hourly);
        setDailyForecast(weatherData.daily);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeatherError(error.message || 'Failed to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  // Refresh weather data
  const handleRefresh = async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const weatherData = await fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY);
      
      setWeather(weatherData.weather);
      setHourly(weatherData.hourly);
      setDailyForecast(weatherData.daily);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing weather:', error);
      setWeatherError(error.message || 'Failed to refresh weather data');
    } finally {
      setWeatherLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Header with back button and refresh */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              {t('back_to_dashboard') || 'Back to Dashboard'}
            </button>
            <h1 className="text-2xl font-bold">{t('weather_forecast') || 'Weather Forecast'}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={weatherLoading}
              className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faRefresh} className={`mr-2 ${weatherLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Weather Card */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          {weatherLoading && (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <h2 className="text-4xl font-bold">{Math.round(weather.temp)}°C</h2>
                <div className="text-gray-600 text-lg">{weather.desc}</div>
                <div className="text-gray-500 text-sm">Last updated: {new Date(weather.time).toLocaleTimeString()}</div>
                
                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="flex items-center text-blue-600">
                    <FontAwesomeIcon icon={faDroplet} className="mr-2 w-4" />
                    <span>Humidity: {weather.humidity ? Math.round(weather.humidity) : 'N/A'}%</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 w-4" />
                    <span>Weather: {weather.desc}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="text-8xl text-blue-200">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
                    alt={weather.desc}
                    className="w-24 h-24"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Toggle between hourly and daily forecast */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeWeatherView === 'hourly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveWeatherView('hourly')}
            >
              {t('hourly') || 'Hourly'}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeWeatherView === 'daily'
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
                <div className="flex justify-between overflow-x-auto pb-2 space-x-2">
                  {hourly.map((hour, index) => (
                    <div key={index} className="text-center px-3 py-2 bg-gray-50 rounded-lg min-w-[80px]">
                      <div className="text-sm font-medium text-gray-500">{formatHour(hour.time)}</div>
                      <div className="my-2">
                        <img 
                          src={`https://openweathermap.org/img/wn/${hour.values.icon || getWeatherIcon(hour.values.weatherCode)}.png`} 
                          alt={hour.values.desc || getWeatherDesc(hour.values.weatherCode)}
                          className="w-8 h-8 mx-auto"
                        />
                      </div>
                      <div className="text-sm font-medium">{Math.round(hour.values.temperature)}°C</div>
                      <div className="text-xs text-gray-500">{hour.values.humidity ? Math.round(hour.values.humidity) + '%' : ''}</div>
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
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div className="font-medium w-16">{formatDay(day.time)}</div>
                      <div className="flex items-center">
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.values.icon || getWeatherIcon(day.values.weatherCodeMax)}.png`} 
                          alt={day.values.desc || getWeatherDesc(day.values.weatherCodeMax)}
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="text-gray-600 text-sm flex-1 ml-4">{day.values.desc || getWeatherDesc(day.values.weatherCodeMax)}</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{Math.round(day.values.temperatureMax)}°C</span>
                        <span className="text-gray-400 text-sm">{Math.round(day.values.temperatureMin)}°C</span>
                        {day.values.humidity && (
                          <div className="flex items-center text-blue-600 ml-2">
                            <FontAwesomeIcon icon={faDroplet} className="w-3 h-3 mr-1" />
                            <span className="text-xs">{Math.round(day.values.humidity)}%</span>
                          </div>
                        )}
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

          {/* Weather Analysis AI Component */}
          <div className="mt-4">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faBrain} className="text-blue-500 mr-2" />
              <h3 className="text-sm font-semibold text-gray-800">{t('ai_weather_analysis') || 'AI Weather Analysis'}</h3>
            </div>
            {weather && dailyForecast.length > 0 ? (
              <WeatherAnalysis
                weather={{
                  temp: `${Math.round(weather.temp)}°C`,
                  desc: weather.desc,
                  humidity: weather.humidity ? `${Math.round(weather.humidity)}%` : 'N/A',
                  time: new Date(weather.time).toLocaleTimeString()
                }}
                daily={dailyForecast.map((day, index) => ({
                  time: day.time,
                  values: {
                    temperatureMax: day.values.temperatureMax,
                    temperatureMin: day.values.temperatureMin,
                    weatherCodeMax: day.values.weatherCodeMax,
                    precipitationSum: day.values.precipitation || 0
                  }
                }))}
                formatDay={(date) => formatDay(date)}
                getWeatherDesc={(code) => getWeatherDesc(code)}
              />
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-gray-700">
                <p>{t('weather_loading') || 'Weather data is loading. Please wait...'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Weather Summary */}
        <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">{t('weather_summary') || 'Weather Summary'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Temperature Card */}
            {weather && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faTemperatureHigh} className="text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Current Temperature</h3>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(weather.temp)}°C
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {weather.desc}
                </p>
              </div>
            )}

            {/* Humidity Card */}
            {weather && weather.humidity && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faDroplet} className="text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">Humidity</h3>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(weather.humidity)}%
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {weather.humidity > 70 ? 'High humidity' : weather.humidity > 40 ? 'Moderate humidity' : 'Low humidity'}
                </p>
              </div>
            )}

            {/* Forecast Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faCloudSun} className="text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-800">7-Day Forecast</h3>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {dailyForecast.length} days
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Extended weather outlook available
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TomorrowWeatherPage;
