import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Crop status badge with appropriate coloring
// Format date helper
const formatDate = (date) => {
  if (!date) return 'Not set';
  return format(date, 'MMM d, yyyy');
};

// Crop status badge with appropriate coloring  
const CropStatusBadge = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";

  switch (status) {
    case 'Growing':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case 'Harvested':
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      break;
    case 'Planning':
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case 'Failed':
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case 'Completed':
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
  }

  return (
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
      {status}
    </span>
  );
};
import {
  faCloudSun,
  faSeedling,
  faPlus,
  faChartLine,
  faCalendarAlt,
  faDroplet,
  faLeaf,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faInfoCircle,
  faCloudRain,
  faMapMarkerAlt,
  faTemperatureHigh,
  faTemperatureLow,
  faWind,
  faTachometerAlt,
  faUmbrella,
  faBrain,
  faTrash
}
  from '@fortawesome/free-solid-svg-icons';
import WeatherAnalysis from '../WeatherAnalysis';
import CropModal from '../CropModal';

const LightThemeHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');
  if (!userId) {
    navigate('/login');
  }

  // Weather state
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [activeWeatherView, setActiveWeatherView] = useState('hourly'); // 'hourly' or 'daily'
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Crop management state
  const [crops, setCrops] = useState([
    {
      _id: '1',
      name: 'Maize',
      status: 'Planning',
      plantingDate: null,
      growthStage: null,
      lastIrrigation: null,
      lastFertilization: null
    }
  ]);
  const [filteredCrops, setFilteredCrops] = useState(crops);
  const [newCrop, setNewCrop] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all_status');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState('');

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch('http://localhost:5000/api/crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          navigate('/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        setCrops(data);
        setFilteredCrops(data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchCrops();
  }, [navigate]);

  // Weather code to description
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

  // Weather code to icon
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

  // Format hour
  const formatHour = (iso) => {
    const date = new Date(iso);
    return date.getHours() + ":00";
  };

  // Format day
  const formatDay = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  // Fetch weather data
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation not supported");
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${import.meta.env.VITE_WEATHER_API_KEY}&timesteps=1h,1d&units=metric`
        )
          .then((res) => res.json())
          .then((data) => {
            const current = data.timelines.hourly[0];
            setWeather({
              temp: Math.round(current.values.temperature) + '°C',
              desc: getWeatherDesc(current.values.weatherCode),
              condition: getWeatherDesc(current.values.weatherCode),
              icon: getWeatherIcon(current.values.weatherCode),
              time: current.time,
              humidity: Math.round(current.values.humidity) + '%',
              wind: Math.round(current.values.windSpeed) + ' km/h',
              pressure: Math.round(current.values.pressureSurfaceLevel) + ' hPa'
            });

            // Process hourly data
            const hourlyData = data.timelines.hourly.slice(0, 6).map(hour => ({
              time: formatHour(hour.time),
              temp: Math.round(hour.values.temperature) + '°C',
              icon: getWeatherIcon(hour.values.weatherCode)
            }));
            setHourly(hourlyData);

            // Process daily data
            const dailyData = data.timelines.daily.slice(0, 7).map((day, index) => ({
              day: index === 0 ? 'Today' : formatDay(day.time),
              temp: Math.round(day.values.temperatureAvg) + '°C',
              high: Math.round(day.values.temperatureMax) + '°C',
              low: Math.round(day.values.temperatureMin) + '°C',
              condition: getWeatherDesc(day.values.weatherCodeMax),
              icon: getWeatherIcon(day.values.weatherCodeMax),
              weatherCode: day.values.weatherCodeMax,
              precipitation: Math.round(day.values.precipitationProbabilityAvg)
            }));
            setDailyForecast(dailyData);

            setWeatherLoading(false);
          })
          .catch((error) => {
            console.error("Weather API Error:", error);
            setWeatherError("Failed to fetch weather data");
            setWeatherLoading(false);
          });
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setWeatherError("Location access denied");
        setWeatherLoading(false);
      }
    );
  }, []);
  // const data = await response.json();
  // setWeather({ ... });
  // setHourly([ ... ]);
  // setDailyForecast([ ... ]);



  const openCropModal = () => {
    setIsCropModalOpen(true);
  };

  // Close the crop modal
  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setCropError('');
  };

  // Handle adding a new crop with detailed information
  const handleAddCrop = async (cropData) => {
    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:5000/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cropData)
      });

      if (!res.ok) throw new Error('Failed to add crop');

      const crop = await res.json();
      setCrops([...crops, crop]);
      setFilteredCrops([...filteredCrops, crop]);
      closeCropModal();
    } catch (err) {
      console.error('Error adding crop:', err);
      setCropError('Failed to add crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Remove crop from backend
  const handleRemoveCrop = async (cropId, event) => {
    // Prevent navigation to crop details when clicking delete
    event.stopPropagation();

    if (!confirm(t('confirm_delete_crop'))) {
      return;
    }

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete crop');

      setCrops(crops.filter(crop => crop._id !== cropId));
      setFilteredCrops(filteredCrops.filter(crop => crop._id !== cropId));
    } catch (err) {
      console.error('Error deleting crop:', err);
      setCropError('Failed to delete crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Handle searching and filtering
  useEffect(() => {
    let result = [...crops];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(crop =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all_status') {
      result = result.filter(crop => crop.status === filterStatus);
    }

    setFilteredCrops(result);
  }, [crops, searchQuery, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Crop Management Section */}
      <section className="p-6 mb-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
          </div>
          <span className="ml-3 text-lg font-medium text-gray-800">track_and_manage</span>
          <div className="ml-auto">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
              onClick={() => navigate('/crop-recommendation')}
            >
              Get Recommendation
            </button>
          </div>
        </div>

        {/* Add new crop - Button to open modal */}
        <div className="mb-4">
          <button
            onClick={openCropModal}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t('add_new_crop')}
          </button>

          {/* Display crop error */}
          {cropError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mt-3 text-sm">
              {cropError}
            </div>
          )}
        </div>

        {/* Search and filter */}
        <div className="flex mb-4 gap-2">
          <div className="relative flex-grow">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search_crops"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="all_status">all_status</option>
              <option value="Planning">Planning</option>
              <option value="Growing">Growing</option>
              <option value="Harvested">Harvested</option>
            </select>
          </div>
        </div>

        {/* Crop cards */}
        <div className="space-y-4">
          {filteredCrops.map((crop) => (
            <div
              key={crop._id}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/crops/${crop._id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium text-gray-800">{crop.name}</h3>
                <button
                  onClick={(e) => handleRemoveCrop(crop._id, e)}
                  className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                  title={t('delete_crop')}
                  aria-label={t('delete_crop')}
                >
                  <FontAwesomeIcon icon={faTrash} size="sm" />
                </button>
              </div>

              <div className="mb-3">
                <CropStatusBadge status={crop.status || 'Planning'} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">planting_date</div>
                    <div className="text-sm">{formatDate(crop.plantingDate)}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FontAwesomeIcon icon={faChartLine} className="text-green-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">growth_stage</div>
                    <div className="text-sm">{crop.growthStage || 'not recorded'}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FontAwesomeIcon icon={faDroplet} className="text-blue-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">last_irrigation</div>
                    <div className="text-sm">{crop.lastIrrigation ? format(new Date(crop.lastIrrigation), 'MMM d') : 'Never'}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FontAwesomeIcon icon={faLeaf} className="text-amber-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">last_fertilization</div>
                    <div className="text-sm">{crop.lastFertilization ? format(new Date(crop.lastFertilization), 'MMM d') : 'never'}</div>
                  </div>
                </div>
              </div>

              <div className="text-right mt-3">
                <span className="text-green-600 text-sm font-medium hover:underline">
                  Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weather Section */}
      <section className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faCloudSun} className="text-blue-600" />
            </div>
            <span className="ml-3 text-lg font-medium text-gray-800">Weather</span>
            <span className="ml-2 text-sm text-gray-500">Your local forecast</span>
          </div>

          {/* Toggle between hourly and daily forecast */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              className={`px-4 py-1 text-sm font-medium ${activeWeatherView === 'hourly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveWeatherView('hourly')}
            >
              Hourly
            </button>
            <button
              className={`px-4 py-1 text-sm font-medium ${activeWeatherView === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveWeatherView('daily')}
            >
              7-Day
            </button>
          </div>
        </div>

        {/* Weather loading/error states */}
        {weatherLoading && (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}

        {weatherError && (
          <div className="p-4 mb-6 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              {weatherError}
            </div>
          </div>
        )}

        {/* Current weather */}
        {!weatherLoading && !weatherError && weather && (
          <div className="flex justify-between mb-6">
            <div>
              <div className="text-5xl font-light text-gray-800 mb-1">{weather.temp}</div>
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

        {!weatherLoading && !weatherError && (
          activeWeatherView === 'hourly' ? (
            /* Hourly forecast */
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Today's Forecast</h3>
              <div className="flex justify-between">
                {hourly.map((hour, index) => (
                  <div key={index} className="text-center">
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
              <h3 className="text-sm font-semibold text-gray-500 mb-3">7-Day Forecast</h3>
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

        {/* Weather-based farming advisory */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faSeedling} className="text-green-500 mr-2" />
            <h3 className="text-sm font-semibold text-gray-800">Farming Advisory</h3>
          </div>

          {/* Static advisory */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-gray-700 mb-4">
            <p className="mb-2"><span className="font-medium">Irrigation:</span> Based on the forecast, consider light irrigation in the evening as the next two days show partly cloudy conditions.</p>
            <p><span className="font-medium">Crop Protection:</span> Rain expected on Tuesday and Wednesday. Consider applying fungicide preventatively to protect crops from potential fungal diseases.</p>
          </div>

          {/* Weather Analysis AI Component */}
          <div className="mt-4">
            <div className="flex items-center mb-3">
              <FontAwesomeIcon icon={faBrain} className="text-blue-500 mr-2" />
              <h3 className="text-sm font-semibold text-gray-800">AI Weather Analysis</h3>
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
                <p>Weather data is loading. Please wait...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Crop Modal */}
      <CropModal
        isOpen={isCropModalOpen}
        onClose={closeCropModal}
        onAddCrop={handleAddCrop}
        loading={cropLoading}
      />
    </div>
  );
};

export default LightThemeHome;