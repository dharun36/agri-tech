import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
} from '@fortawesome/free-solid-svg-icons';

// Import components
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import WeatherAnalysis from './WeatherAnalysis';
import useDiseaseAlerts from './useDiseaseAlerts';

const ModernHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');
  if (!userId) {
    navigate('/login');
  }

  // Use the disease alerts hook
  useDiseaseAlerts(userId);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Crop management state
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [newCrop, setNewCrop] = useState('');
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
      setCropLoading(true);
      setCropError('');
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
        setCropError('Failed to load crops: ' + err.message);
      } finally {
        setCropLoading(false);
      }
    };

    fetchCrops();
  }, [navigate]);

  // Filter crops when search query or filter status changes
  useEffect(() => {
    let result = [...crops];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(crop =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.variety && crop.variety.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(crop => crop.status === filterStatus);
    }

    setFilteredCrops(result);
  }, [searchQuery, filterStatus, crops]);

  // Handle adding a new crop
  const handleAddCrop = async () => {
    if (!newCrop.trim()) return;
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
        body: JSON.stringify({ name: newCrop.trim() })
      });

      if (!res.ok) throw new Error('Failed to add crop');

      const crop = await res.json();
      setCrops([...crops, crop]);
      setFilteredCrops([...filteredCrops, crop]);
      setNewCrop('');
    } catch (err) {
      setCropError(t('failed_to_add_crop'));
    } finally {
      setCropLoading(false);
    }
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newCrop.trim()) {
      e.preventDefault();
      handleAddCrop();
    }
  };

  // Navigate to crop details
  const handleCropClick = (cropId) => {
    navigate(`/crops/${cropId}`);
  };

  // Remove crop from backend
  const handleRemoveCrop = async (cropId) => {
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
      setCropError('Failed to delete crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Fetch weather on mount
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
              temp: current.values.temperature,
              desc: getWeatherDesc(current.values.weatherCode),
              icon: getWeatherIcon(current.values.weatherCode),
              time: current.time,
              humidity: current.values.humidity || null,
            });
            setHourly(data.timelines.hourly.slice(0, 6));
            setDaily(data.timelines.daily.slice(0, 7));
            setWeatherLoading(false);
          })
          .catch(() => {
            setWeatherError("Failed to fetch weather");
            setWeatherLoading(false);
          });
      },
      () => {
        setWeatherError("Location access denied");
        setWeatherLoading(false);
      }
    );
  }, []);

  // Weather code to description (simplified)
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
    const map = {
      1000: "01d",
      1100: "02d",
      1101: "03d",
      1102: "04d",
      1001: "04d",
      2000: "50d",
      2100: "50d",
      4000: "09d",
      4001: "10d",
      4200: "09d",
      4201: "10d",
      5000: "13d",
      5001: "13d",
      5100: "13d",
      5101: "13d",
      6000: "13d",
      6001: "13d",
      6200: "13d",
      6201: "13d",
      7000: "13d",
      7101: "13d",
      7102: "13d",
      8000: "11d",
    };
    return map[code] || "01d";
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

  // Helper function to get last irrigation date
  const getLastIrrigationDate = (crop) => {
    if (!crop.irrigationHistory || crop.irrigationHistory.length === 0) {
      return null;
    }

    return new Date(
      Math.max(...crop.irrigationHistory.map(e => new Date(e.date).getTime()))
    );
  };

  // Helper function to get last fertilization date
  const getLastFertilizationDate = (crop) => {
    if (!crop.fertilizationHistory || crop.fertilizationHistory.length === 0) {
      return null;
    }

    return new Date(
      Math.max(...crop.fertilizationHistory.map(e => new Date(e.date).getTime()))
    );
  };

  // Helper function to get current growth stage
  const getCurrentGrowthStage = (crop) => {
    if (!crop.growthHistory || crop.growthHistory.length === 0) {
      return null;
    }

    // Sort growth history by date descending
    const sortedHistory = [...crop.growthHistory].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedHistory[0].stage;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard_description')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Crops */}
          <div className="lg:col-span-2 space-y-8">
            {/* Crop management section */}
            <Card variant="gradient" className="overflow-visible">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow-inner text-green-600">
                    <FontAwesomeIcon icon={faSeedling} size="lg" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('my_crops')}</h2>
                    <p className="text-gray-500 text-sm">{t('track_and_manage')}</p>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() => navigate('/crop-recommendation')}
                    variant="outline"
                    size="sm"
                  >
                    {t('get_recommendation')}
                  </Button>
                </div>
              </div>

              {/* Add new crop */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-grow">
                    <Input
                      type="text"
                      placeholder={t('add_new_crop')}
                      value={newCrop}
                      onChange={(e) => setNewCrop(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleAddCrop}
                    disabled={cropLoading || !newCrop.trim()}
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    {t('add_crop')}
                  </Button>
                </div>

                {/* Display crop error */}
                {cropError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mt-3 text-sm">
                    {cropError}
                  </div>
                )}
              </div>

              {/* Search and filter */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('search_crops')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  >
                    <option value="all">{t('all_status')}</option>
                    <option value="Planning">{t('planning')}</option>
                    <option value="Growing">{t('growing')}</option>
                    <option value="Harvested">{t('harvested')}</option>
                    <option value="Completed">{t('completed')}</option>
                    <option value="Failed">{t('failed')}</option>
                  </select>
                </div>
              </div>

              {/* Crop loading state */}
              {cropLoading && crops.length === 0 && (
                <div className="flex justify-center items-center p-8">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-600">{t('loading_crops')}</span>
                </div>
              )}

              {/* No crops state */}
              {!cropLoading && filteredCrops.length === 0 && (
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-12 px-4 border-2 border-dashed border-gray-200">
                  <FontAwesomeIcon icon={faSeedling} className="text-gray-400 text-4xl mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">
                    {crops.length === 0 ? t('no_crops') : t('no_matching_crops')}
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    {crops.length === 0
                      ? t('add_first_crop_description')
                      : t('adjust_filters_description')
                    }
                  </p>
                </div>
              )}

              {/* Crop cards grid */}
              {filteredCrops.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredCrops.map((crop) => (
                    <div
                      key={crop._id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => handleCropClick(crop._id)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {crop.name}
                              {crop.variety && <span className="text-sm text-gray-500 ml-1">({crop.variety})</span>}
                            </h3>
                            <div>
                              <CropStatusBadge status={crop.status || 'Growing'} />
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCrop(crop._id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 transition"
                            title={t('remove')}
                          >
                            &times;
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="flex items-start">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mt-1 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">{t('planting_date')}</div>
                              <div className="text-sm font-medium">
                                {crop.plantingDate ? formatDate(new Date(crop.plantingDate)) : t('not_set')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <FontAwesomeIcon icon={faChartLine} className="text-green-500 mt-1 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">{t('growth_stage')}</div>
                              <div className="text-sm font-medium">
                                {getCurrentGrowthStage(crop)
                                  ? t(getCurrentGrowthStage(crop))
                                  : t('not_recorded')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <FontAwesomeIcon icon={faDroplet} className="text-blue-500 mt-1 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">{t('last_irrigation')}</div>
                              <div className="text-sm font-medium">
                                {getLastIrrigationDate(crop)
                                  ? formatDate(getLastIrrigationDate(crop))
                                  : t('never')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <FontAwesomeIcon icon={faLeaf} className="text-amber-500 mt-1 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">{t('last_fertilization')}</div>
                              <div className="text-sm font-medium">
                                {getLastFertilizationDate(crop)
                                  ? formatDate(getLastFertilizationDate(crop))
                                  : t('never')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Field location if available */}
                        {(crop.location?.name || crop.fieldId) && (
                          <div className="mt-3 flex items-center text-sm text-gray-500">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400" />
                            <span>{crop.location?.name || crop.fieldId}</span>
                          </div>
                        )}

                        {/* View details button */}
                        <div className="mt-4 pt-3 border-t border-gray-100 text-right">
                          <span className="text-sm text-green-600 font-medium hover:text-green-700">
                            {t('view_details')} &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Weather and alerts */}
          <div className="space-y-8">
            {/* Weather widget */}
            <Card variant="glass" className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-inner text-blue-600">
                  <FontAwesomeIcon icon={faCloudSun} size="lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('weather')}</h2>
                  <p className="text-gray-500 text-sm">{t('local_forecast')}</p>
                </div>
              </div>

              {/* Weather loading/error states */}
              {weatherLoading && (
                <div className="flex justify-center items-center p-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-600">{t('loading_weather')}</span>
                </div>
              )}

              {weatherError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mt-1 mr-2" />
                    <div>
                      <p className="font-medium">{weatherError}</p>
                      <p className="text-sm mt-1">{t('check_location_settings')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current weather */}
              {!weatherLoading && !weatherError && weather && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-3xl font-bold">{Math.round(weather.temp)}°C</div>
                      <div className="text-gray-600">{weather.desc}</div>
                    </div>
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.desc}
                      className="w-16 h-16"
                    />
                  </div>

                  {weather.humidity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon={faDroplet} className="text-blue-500" />
                      <span>{t('humidity')}: {weather.humidity}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hourly forecast */}
              {!weatherLoading && !weatherError && hourly.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">{t('next_hours')}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {hourly.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center bg-white rounded-lg p-2 border border-gray-100 min-w-[64px]"
                      >
                        <span className="text-sm text-gray-700">{formatHour(h.time)}</span>
                        <img
                          src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`}
                          alt=""
                          className="w-8 h-8"
                        />
                        <span className="text-sm font-bold">{Math.round(h.values.temperature)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather analysis */}
              {!weatherLoading && !weatherError && weather && (
                <WeatherAnalysis
                  weather={weather}
                  daily={daily}
                  formatDay={formatDay}
                  getWeatherDesc={getWeatherDesc}
                />
              )}

              {/* Weather tips */}
              {!weatherLoading && !weatherError && weather && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1 mr-2" />
                    <div>
                      <h4 className="font-medium text-gray-800">{t('farming_tip')}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {weather.temp > 30
                          ? t('high_temp_tip')
                          : weather.temp < 10
                            ? t('low_temp_tip')
                            : t('moderate_temp_tip')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather forecast link */}
              <div className="mt-4 pt-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/weather-analysis')}
                >
                  <FontAwesomeIcon icon={faCloudRain} className="mr-1" />
                  {t('detailed_forecast')}
                </Button>
              </div>
            </Card>

            {/* Additional sidebar widgets can be added here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHome;