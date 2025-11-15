import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
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
  faMapMarkerAlt,
  faRupeeSign,
  faClipboardList,
  faCheckCircle,
  faArrowRight,
  faTrash,
  faList
} from '@fortawesome/free-solid-svg-icons'
import {
  FaSeedling,
  FaPlus,
  FaTrash,
  FaSearch,
  FaLeaf,
  FaRupeeSign,
  FaHandHoldingUsd,
  FaTint,
  FaExclamationTriangle,
  FaCloudRain,
  FaTasks,
  FaCloudSun,
  FaFilter
} from 'react-icons/fa'
import CropModal from './CropModal';
import useDiseaseAlerts from './useDiseaseAlerts';
import WeatherAnalysis from './WeatherAnalysis';
import TaskDashboard from './tasks/TaskDashboard';
import ModernCropCard from './crops/ModernCropCard';
import QuickActionButton from './ui/QuickActionButton';
import CropFilter from './ui/CropFilter';
import QuickEventForm from './ui/QuickEventForm';
import TodayTasksWidget from './TodayTasksWidget';


// Format date helper
const formatDate = (date) => {
  if (!date) return 'Not set';
  return format(date, 'MMM d, yyyy');
};

// Format hour helper
const formatHour = (timestamp) => {
  if (!timestamp) return '';
  return format(new Date(timestamp), 'ha');
};

// Format day helper
const formatDay = (timestamp) => {
  if (!timestamp) return '';
  return format(new Date(timestamp), 'EEE');
};

// Get weather icon helper
const getWeatherIcon = (code) => {
  // Default mapping of weather codes to OpenWeatherMap icon codes
  const iconMap = {
    0: '01d', // Clear sky
    1: '02d', // Partly cloudy
    2: '03d', // Cloudy
    3: '04d', // Overcast
    45: '50d', // Fog
    48: '50d', // Depositing rime fog
    51: '09d', // Light drizzle
    53: '09d', // Moderate drizzle
    55: '09d', // Dense drizzle
    56: '09d', // Light freezing drizzle
    57: '09d', // Dense freezing drizzle
    61: '10d', // Slight rain
    63: '10d', // Moderate rain
    65: '10d', // Heavy rain
    66: '13d', // Light freezing rain
    67: '13d', // Heavy freezing rain
    71: '13d', // Slight snow fall
    73: '13d', // Moderate snow fall
    75: '13d', // Heavy snow fall
    77: '13d', // Snow grains
    80: '09d', // Slight rain showers
    81: '09d', // Moderate rain showers
    82: '09d', // Violent rain showers
    85: '13d', // Slight snow showers
    86: '13d', // Heavy snow showers
    95: '11d', // Thunderstorm
    96: '11d', // Thunderstorm with slight hail
    99: '11d', // Thunderstorm with heavy hail
  };
  return iconMap[code] || '01d';
};

// Get weather description helper
const getWeatherDesc = (code) => {
  const descMap = {
    0: 'Clear sky',
    1: 'Partly cloudy',
    2: 'Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descMap[code] || 'Unknown';
};

// Fetch weather data from API
const fetchWeatherData = async (latitude, longitude, apiKey) => {
  try {
    // Using OpenMeteo free weather API as an example
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&current_weather=true`
    );

    if (!res.ok) {
      throw new Error('Weather API error');
    }

    const data = await res.json();

    // Process hourly data (next 24 hours)
    const hourly = data.hourly.time.slice(0, 24).map((time, index) => ({
      time,
      values: {
        temperature: data.hourly.temperature_2m[index],
        weatherCode: data.hourly.weathercode[index],
        precipitation: data.hourly.precipitation[index]
      }
    }));

    // Process daily data (next 7 days)
    const daily = data.daily.time.map((time, index) => ({
      time,
      values: {
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        weatherCodeMax: data.daily.weathercode[index],
        precipitation: data.daily.precipitation_sum[index]
      }
    }));

    // Return processed data
    return {
      weather: data.current_weather,
      hourly,
      daily
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
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


const MergedLightThemeHome = () => {
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();
  const { cropId } = useParams(); // Get cropId from URL params if present

  // Get userId from localStorage
  let userId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.id || user._id;
    }
  } catch {
    // Error handling for localStorage parsing
  }

  // Initialize disease alerts
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all_status');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [currentCropId, setCurrentCropId] = useState(null);
  const [expense, setExpense] = useState({ description: '', category: 'Fertilizer', amount: 0 });
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState('');
  const [newCrop, setNewCrop] = useState("");

  // Quick Event Form state
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [quickEventType, setQuickEventType] = useState(null);
  const [quickEventCrop, setQuickEventCrop] = useState(null);

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
        fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY)
          .then(({ weather, hourly, daily }) => {
            setWeather(weather);
            setHourly(hourly);
            setDaily(daily);
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

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch crops');

        const data = await res.json();

        // Add next action suggestions for each crop based on status
        const dataWithNextActions = data.map(crop => {
          const nextActions = generateNextActions(crop);
          return { ...crop, nextActions };
        });

        setCrops(dataWithNextActions);
        setFilteredCrops(dataWithNextActions);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchCrops();
  }, [navigate]);

  // State for sorting
  const [sortBy, setSortBy] = useState('name');

  // Effect for filtering and sorting crops based on search and filter
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...crops];

      // Apply search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(crop =>
          crop.name.toLowerCase().includes(query) ||
          (crop.variety && crop.variety.toLowerCase().includes(query))
        );
      }

      // Apply status filter
      if (filterStatus !== 'all_status') {
        filtered = filtered.filter(crop => crop.status === filterStatus);
      }

      // Apply sorting
      switch (sortBy) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'date_new':
          filtered.sort((a, b) => {
            const dateA = a.plantingDate ? new Date(a.plantingDate) : new Date(0);
            const dateB = b.plantingDate ? new Date(b.plantingDate) : new Date(0);
            return dateB - dateA;
          });
          break;
        case 'date_old':
          filtered.sort((a, b) => {
            const dateA = a.plantingDate ? new Date(a.plantingDate) : new Date(0);
            const dateB = b.plantingDate ? new Date(b.plantingDate) : new Date(0);
            return dateA - dateB;
          });
          break;
        default:
          // Default to sorting by name
          filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      setFilteredCrops(filtered);
    };

    applyFilters();
  }, [searchQuery, filterStatus, crops, sortBy]);

  // Generate next actions based on crop data
  const generateNextActions = (crop) => {
    const actions = [];

    if (crop.status === 'Planning') {
      actions.push('Prepare soil', 'Purchase seeds', 'Plan planting schedule');
    } else if (crop.status === 'Growing') {
      // Check if irrigation is needed
      if (!crop.lastIrrigation) {
        actions.push('Water the crop');
      } else {
        const lastIrrigDate = new Date(crop.lastIrrigation);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (lastIrrigDate < threeDaysAgo) {
          actions.push('Water the crop');
        }
      }

      // Check if fertilization is needed
      if (!crop.lastFertilization) {
        actions.push('Apply fertilizer');
      } else {
        const lastFertDate = new Date(crop.lastFertilization);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if (lastFertDate < twoWeeksAgo) {
          actions.push('Apply fertilizer');
        }
      }

      // Check growth stage
      if (!crop.growthStage || crop.growthStage === 'Seedling') {
        actions.push('Update growth stage', 'Monitor for pests');
      } else if (crop.growthStage === 'Vegetative') {
        actions.push('Check for diseases', 'Consider adding supports');
      } else if (crop.growthStage === 'Reproductive') {
        actions.push('Monitor fruit development', 'Prepare for harvest');
      }
    } else if (crop.status === 'Harvested') {
      actions.push('Record yield data', 'Plan for next season', 'Analyze crop performance');
    }

    return actions;
  };

  // Open crop modal
  const openCropModal = () => {
    setIsCropModalOpen(true);
  };

  // Close crop modal
  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setCropError('');
  };

  // Open expense modal for a specific crop
  const openExpenseModal = (cropId, event) => {
    // Prevent navigation to crop details when clicking add expense
    event.stopPropagation();

    setCurrentCropId(cropId);
    setIsExpenseModalOpen(true);
    setExpense({ description: '', category: 'Fertilizer', amount: 0 });
  };

  // Close expense modal
  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setCurrentCropId(null);
    setCropError('');
  };

  // Open quick event form
  const openQuickEventForm = (cropId, eventType) => {
    const crop = crops.find(c => c._id === cropId);
    if (crop) {
      setQuickEventCrop(crop);
      setQuickEventType(eventType);
      setShowQuickEventForm(true);
    }
  };

  // Close quick event form
  const closeQuickEventForm = () => {
    setShowQuickEventForm(false);
    setQuickEventCrop(null);
    setQuickEventType(null);
  };

  // Handle quick event success
  const handleQuickEventSuccess = async (eventType, eventData) => {
    // Refresh crops data to show updated info
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to refresh crop data');

      const data = await res.json();
      const dataWithNextActions = data.map(crop => {
        const nextActions = generateNextActions(crop);
        return { ...crop, nextActions };
      });

      setCrops(dataWithNextActions);
      setFilteredCrops(dataWithNextActions);
    } catch (err) {
      console.error('Refresh error:', err);
    }
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cropData)
      });

      if (!res.ok) throw new Error('Failed to add crop');

      const newCrop = await res.json();
      const newCropWithActions = {
        ...newCrop,
        nextActions: generateNextActions(newCrop)
      };

      setCrops([...crops, newCropWithActions]);
      setFilteredCrops([...filteredCrops, newCropWithActions]);
      closeCropModal();
    } catch (err) {
      console.error('Error adding crop:', err);
      setCropError('Failed to add crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Handle adding an expense to a crop
  const handleAddExpense = async (e) => {
    e.preventDefault();

    setCropError('');
    setCropLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${currentCropId}/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expense)
      });

      if (!res.ok) throw new Error('Failed to add expense');

      const updatedCrop = await res.json();
      const updatedCropWithActions = {
        ...updatedCrop,
        nextActions: generateNextActions(updatedCrop)
      };

      // Update crops state with the updated crop
      setCrops(crops.map(crop => crop._id === currentCropId ? updatedCropWithActions : crop));
      setFilteredCrops(filteredCrops.map(crop =>
        crop._id === currentCropId ? updatedCropWithActions : crop
      ));

      closeExpenseModal();
    } catch (err) {
      console.error('Error adding expense:', err);
      setCropError('Failed to add expense');
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete crop');

      // Update state to remove the deleted crop
      setCrops(crops.filter(crop => crop._id !== cropId));
      setFilteredCrops(filteredCrops.filter(crop => crop._id !== cropId));
    } catch (err) {
      console.error('Error removing crop:', err);
      setCropError('Failed to delete crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Handle adding a quick crop (from Home.jsx)
  const handleAddQuickCrop = async () => {
    if (!newCrop.trim()) return;
    setCropError("");
    setCropLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCrop.trim() })
      });
      if (!res.ok) throw new Error('Failed to add crop');
      const crop = await res.json();
      const cropWithActions = {
        ...crop,
        nextActions: generateNextActions(crop)
      };
      setCrops([...crops, cropWithActions]);
      setFilteredCrops([...filteredCrops, cropWithActions]);
      setNewCrop("");
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
      handleAddQuickCrop();
    }
  };

  // UI Styles
  const card = "bg-white sm:p-1 md:py-5 xl:py-6 rounded-md sm:px-1 md:px-3 xl:px-6 shadow shadow-sm shadow-gray-200 p-4 m-0";
  const sectionTitle = "text-xl font-bold text-gray-800 mb-2 tracking-tight";
  const subTitle = "text-md font-semibold text-gray-600 mb-2";
  const inputStyle = "border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition";
  const buttonStyle = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition";
  const iconBox = "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow text-green-600 text-2xl";

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:px-1 md:px-4 mx:px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Weather and Task Recommendations Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weather Widget */}
          <div className={`${card} w-full lg:col-span-2`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={iconBox}>
                <FaCloudSun />
              </div>
              <div>
                <h2 className={sectionTitle}>{t('weather')}</h2>
                <p className="text-gray-500 text-sm">{t('local_forecast')}</p>
              </div>
            </div>

            {/* Weather Loading/Error States */}
            {weatherLoading && (
              <div className="flex justify-center items-center p-6">
                <div className="animate-pulse text-gray-400">Loading weather data...</div>
              </div>
            )}

            {weatherError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                <p>{weatherError}</p>
                <p className="text-sm mt-1">Please check your location settings and try again.</p>
              </div>
            )}

            {/* Hourly Forecast */}
            {!weatherLoading && !weatherError && (
              <div className="mb-4">
                <div className={subTitle}>{t('next_hours')}</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {hourly.map((h, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-100 min-w-[64px] hover:shadow transition">
                      <span className="font-medium text-gray-700 text-sm">{formatHour(h.time)}</span>
                      <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`} alt="" className="w-8 h-8" />
                      <span className="text-sm font-bold text-gray-800">{Math.round(h.values.temperature)}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Forecast */}
            {!weatherLoading && !weatherError && (
              <div>
                <div className={subTitle}>{t('next_7_days')}</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {daily.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-100 min-w-[64px] hover:shadow transition">
                      <span className="font-medium text-gray-700 text-sm">{formatDay(d.time)}</span>
                      <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`} alt="" className="w-8 h-8" />
                      <span className="text-sm font-bold text-gray-800">{Math.round(d.values.temperatureMax)}°C</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Analysis */}
            <div className="mt-8">
              {!weatherLoading && !weatherError && weather && (
                <WeatherAnalysis
                  weather={weather}
                  daily={daily}
                  formatDay={formatDay}
                  getWeatherDesc={getWeatherDesc}
                />
              )}
            </div>
          </div>

          {/* Today's Tasks Widget */}
          <div className={`${card} w-full`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={iconBox}>
                <FontAwesomeIcon icon={faClipboardList} />
              </div>
              <div>
                <h2 className={sectionTitle}>{t('todays_tasks')}</h2>
                <p className="text-gray-500 text-sm">{t('recommended_for_today')}</p>
              </div>
            </div>
            <TodayTasksWidget crops={filteredCrops} />
          </div>
        </div>

        {/* Crop Management Widget */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className={`${card} w-full`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={iconBox}>
                <FaSeedling />
              </div>
              <div>
                <h2 className={sectionTitle}>{t('my_crops')}</h2>
                <p className="text-gray-500 text-sm">{t('manage_fields')}</p>
              </div>
            </div>

            {/* Add Crop Section - Quick Add */}
            <div className="flex flex-row items-center gap-2 mb-4">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('add').concat(' new crop')}
                className={`${inputStyle} grow h-10`}
              />
              <button
                onClick={handleAddQuickCrop}
                className={`${buttonStyle} flex items-center gap-2`}
              >
                <FaPlus className="text-sm" /> {t('add')}
              </button>
            </div>

            {/* Add New Crop with Details Button */}
            <div className="flex justify-between items-center mb-4">
              {/* <button
                onClick={openCropModal}
                className="text-green-600 font-medium text-sm hover:text-green-700 flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                {t('add_crop_with_details') || 'Add crop with details'}
              </button> */}
              {/* <button
                onClick={() => navigate('/weather')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition"
              >
                <FontAwesomeIcon icon={faCloudSun} className="mr-2" />
                {t('weather_forecast') || 'Weather Forecast'}
              </button> */}
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('active_crops') || 'Active Crops'}</div>
                  <div className="text-xl font-bold">
                    {crops.filter(crop => crop.status !== 'Completed' && crop.status !== 'Failed').length}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faDroplet} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('irrigation_needed') || 'Irrigation Needed'}</div>
                  <div className="text-xl font-bold">
                    {crops.filter(crop => {
                      // If last irrigation was more than 3 days ago or never, it needs irrigation
                      if (!crop.lastIrrigation) return true;
                      const lastIrrigDate = new Date(crop.lastIrrigation);
                      const threeDaysAgo = new Date();
                      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                      return lastIrrigDate < threeDaysAgo && crop.status === 'Growing';
                    }).length}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('days_to_harvest') || 'Days to Harvest'}</div>
                  <div className="text-xl font-bold">
                    {(() => {
                      const harvestableCrops = crops.filter(crop =>
                        crop.status === 'Growing' &&
                        crop.plantingDate &&
                        crop.expectedHarvestDate
                      );
                      if (harvestableCrops.length === 0) return '--';

                      const earliestHarvest = harvestableCrops.reduce((earliest, crop) => {
                        const harvestDate = new Date(crop.expectedHarvestDate);
                        const earliestDate = new Date(earliest.expectedHarvestDate);
                        return harvestDate < earliestDate ? crop : earliest;
                      });

                      const daysToHarvest = Math.ceil((new Date(earliestHarvest.expectedHarvestDate) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysToHarvest > 0 ? daysToHarvest : 0;
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faRupeeSign} className="text-amber-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('total_expenses') || 'Total Expenses'}</div>
                  <div className="text-xl font-bold">
                    ₹{crops.reduce((total, crop) => {
                      return total + (crop.costs ? crop.costs.reduce((cropTotal, cost) => cropTotal + (cost.amount || 0), 0) : 0);
                    }, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('tasks_pending') || 'Tasks Pending'}</div>
                  <div className="text-xl font-bold">
                    {(() => {
                      let pendingTasks = 0;
                      crops.forEach(crop => {
                        if (crop.status !== 'Growing' && crop.status !== 'Planning') return;

                        // Count irrigation needs
                        if (crop.status === 'Growing') {
                          const lastIrrigation = crop.lastIrrigation ? new Date(crop.lastIrrigation) : null;
                          const daysSinceIrrigation = lastIrrigation ? Math.floor((new Date() - lastIrrigation) / (1000 * 60 * 60 * 24)) : null;
                          if (!lastIrrigation || daysSinceIrrigation >= 2) pendingTasks++;

                          // Count fertilization needs
                          const lastFertilization = crop.lastFertilization ? new Date(crop.lastFertilization) : null;
                          const daysSinceFertilization = lastFertilization ? Math.floor((new Date() - lastFertilization) / (1000 * 60 * 60 * 24)) : null;
                          if (!lastFertilization || daysSinceFertilization >= 14) pendingTasks++;

                          // Count pest check needs
                          const lastPestCheck = crop.lastPestCheck ? new Date(crop.lastPestCheck) : null;
                          const daysSincePestCheck = lastPestCheck ? Math.floor((new Date() - lastPestCheck) / (1000 * 60 * 60 * 24)) : null;
                          if (!lastPestCheck || daysSincePestCheck >= 7) pendingTasks++;
                        }

                        if (crop.status === 'Planning') pendingTasks++;
                      });
                      return pendingTasks;
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faChartLine} className="text-emerald-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('crop_varieties') || 'Crop Varieties'}</div>
                  <div className="text-xl font-bold">
                    {new Set(crops.map(crop => crop.name)).size}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faLeaf} className="text-teal-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('growth_stages') || 'Growth Stages'}</div>
                  <div className="text-xl font-bold">
                    {(() => {
                      const stages = ['Seedling', 'Vegetative', 'Reproductive', 'Maturity'];
                      const activeCrops = crops.filter(crop => crop.status === 'Growing');
                      const stagesPresent = new Set(activeCrops.map(crop => crop.growthStage).filter(stage => stage && stages.includes(stage)));
                      return stagesPresent.size || '--';
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl shadow-sm flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faClipboardList} className="text-indigo-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">{t('avg_crop_age') || 'Avg Crop Age'}</div>
                  <div className="text-xl font-bold">
                    {(() => {
                      const activeCrops = crops.filter(crop =>
                        crop.status === 'Growing' && crop.plantingDate
                      );
                      if (activeCrops.length === 0) return '--';

                      const totalDays = activeCrops.reduce((sum, crop) => {
                        const plantDate = new Date(crop.plantingDate);
                        const daysSincePlanting = Math.floor((new Date() - plantDate) / (1000 * 60 * 60 * 24));
                        return sum + daysSincePlanting;
                      }, 0);

                      const avgDays = Math.floor(totalDays / activeCrops.length);
                      return `${avgDays}d`;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="mt-4">
              {/* Display Crop Error */}
              {cropError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg mb-2 flex items-center">
                  <span className="text-sm text-red-600">{cropError}</span>
                </div>
              )}

              {/* Show loading state for crop operations */}
              {cropLoading && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg mb-2 flex items-center">
                  <div className="animate-pulse w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">{t('processing_crop_operation')}</span>
                </div>
              )}
            </div>

            {/* Enhanced Crop Filtering */}
            <CropFilter
              searchQuery={searchQuery}
              onSearchChange={(query) => setSearchQuery(query)}
              filterStatus={filterStatus}
              onFilterStatusChange={(status) => setFilterStatus(status)}
              sortBy={sortBy}
              onSortChange={(sort) => setSortBy(sort)}
            />

            {/* Modern Crop Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {filteredCrops.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                  {searchQuery || filterStatus !== 'all_status'
                    ? t('no_crops_match_filters')
                    : t('no_crops_added')}
                </div>
              ) : (
                filteredCrops.map((crop, idx) => (
                  <ModernCropCard
                    key={idx}
                    crop={crop}
                    onAddEvent={(cropId, eventType) => {
                      openQuickEventForm(cropId, eventType);
                    }}
                    onViewDetails={(cropId) => {
                      // Navigate to crop details
                      navigate(`/crops/${cropId}`);
                    }}
                  />
                ))
              )}
            </div>

            {filteredCrops.length > 6 && (
              <div className="text-center mt-6">
                <QuickActionButton
                  icon={<FaArrowRight />}
                  label={`${t('view_all_crops')} (${filteredCrops.length})`}
                  variant="outline-primary"
                  onClick={() => navigate('/crops')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Crop Task Dashboard */}
        <div className="mt-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-md">
            <div className="p-5 pb-1">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaTasks className="text-green-600" />
                {t('crop_tasks_and_recommendations', { ns: 'tasks' })}
              </h3>
            </div>
            <TaskDashboard cropId={cropId} />
          </div>
        </div>

        {/* Smart Irrigation Insights */}
        <div className="mt-6">
          <div className="rounded-xl shadow-md bg-white border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaTint className="text-blue-600" />
              {t('smart_irrigation_insights')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 border-gray-200">{t('soil_types')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('clay')}:</span>
                    <span className="text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-md">{t('high_retention')}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('sandy')}:</span>
                    <span className="text-yellow-600 font-medium px-2 py-1 bg-yellow-50 rounded-md">{t('low_retention')}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('loamy')}:</span>
                    <span className="text-green-600 font-semibold px-2 py-1 bg-green-50 rounded-md">{t('optimal')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 border-gray-200">{t('crop_water_needs')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('tomatoes')}:</span>
                    <span className="text-red-600 font-medium px-2 py-1 bg-red-50 rounded-md">25mm/{t('day')}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('lettuce')}:</span>
                    <span className="text-green-600 font-medium px-2 py-1 bg-green-50 rounded-md">15mm/{t('day')}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <span className="font-medium">{t('corn')}:</span>
                    <span className="text-yellow-600 font-medium px-2 py-1 bg-yellow-50 rounded-md">30mm/{t('day')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 border-gray-200">{t('alerts')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <div className="flex items-center text-orange-600">
                      <FaExclamationTriangle className="mr-2" />
                      <span className="font-medium">{t('optimal_timing')}</span>
                    </div>
                    <div className="mt-1 pl-6 text-gray-700">6-8 AM</div>
                  </div>
                  <div className="bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <div className="flex items-center text-blue-600">
                      <FaCloudRain className="mr-2" />
                      <span className="font-medium">{t('check_rain_forecast')}</span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-md shadow-sm hover:shadow transition">
                    <div className="flex items-center text-green-600">
                      <FaLeaf className="mr-2" />
                      <span className="font-medium">{t('monitor_soil_moisture')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full">
          <Link to="/disease-detection" className="hover:no-underline">
            <div className="rounded-xl shadow-md bg-white border border-gray-200 p-5 text-center h-full flex flex-col items-center hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-3">
                <FaSearch className="text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('disease_detection')}</h3>
              <p className="text-sm text-gray-600">
                {t('upload_plant_images')}
              </p>
            </div>
          </Link>
          <Link to="/crop-recommendation" className="hover:no-underline">
            <div className="rounded-xl shadow-md bg-white border border-gray-200 p-5 text-center h-full flex flex-col items-center hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-3">
                <FaLeaf className="text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('crop_recommendation')}</h3>
              <p className="text-sm text-gray-600">
                {t('get_best_crop_suggestions')}
              </p>
            </div>
          </Link>
          <Link to="/market-prices" className="hover:no-underline">
            <div className="rounded-xl shadow-md bg-white border border-gray-200 p-5 text-center h-full flex flex-col items-center hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-3">
                <FaRupeeSign className="text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('market_prices')}</h3>
              <p className="text-sm text-gray-600">
                {t('stay_updated_with_latest_prices')}
              </p>
            </div>
          </Link>
          <Link to="/government-schemes" className="hover:no-underline">
            <div className="rounded-xl shadow-md bg-white border border-gray-200 p-5 text-center h-full flex flex-col items-center hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-3">
                <FaHandHoldingUsd className="text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('government_schemes')}</h3>
              <p className="text-sm text-gray-600">
                {t('find_apply_agriculture_subsidy_schemes')}
              </p>
            </div>
          </Link>
        </div> */}
      </div>

      {/* Crop Modal */}
      {isCropModalOpen && (
        <CropModal
          isOpen={isCropModalOpen}
          onClose={closeCropModal}
          onAddCrop={handleAddCrop}
          loading={cropLoading}
          error={cropError}
        />
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{t('add_expense')}</h2>
            <form onSubmit={handleAddExpense}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">{t('category')}</label>
                <select
                  value={expense.category}
                  onChange={(e) => setExpense({ ...expense, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Fertilizer">{t('fertilizer')}</option>
                  <option value="Seed">{t('seed')}</option>
                  <option value="Pesticide">{t('pesticide')}</option>
                  <option value="Labor">{t('labor')}</option>
                  <option value="Equipment">{t('equipment')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-1">{t('amount')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              {cropError && <div className="text-red-500 mb-4">{cropError}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={cropLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                >
                  {cropLoading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />}
                  {t('add_expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Event Modal */}
      {showQuickEventForm && quickEventCrop && quickEventType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <QuickEventForm
              crop={quickEventCrop}
              eventType={quickEventType}
              onClose={closeQuickEventForm}
              onSuccess={handleQuickEventSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MergedLightThemeHome;
