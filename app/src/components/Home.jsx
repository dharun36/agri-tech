import React, { useEffect, useState } from 'react'
import useDiseaseAlerts from './useDiseaseAlerts'
import WeatherAnalysis from './WeatherAnalysis'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaCloudSun,
  FaSeedling,
  FaPlus,
  FaTrash,
  FaSearch,
  FaLeaf,
  FaRupeeSign,
  FaHandHoldingUsd,
  FaTint,
  FaExclamationTriangle,
  FaCloudRain
} from "react-icons/fa"
import { useTranslation } from 'react-i18next'

function Home() {
  const { t } = useTranslation()
  // no animation states

  // Get userId from localStorage (assuming user info is stored after login/signup)
  let userId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.id || user._id;
    }
  } catch {

  }

  useDiseaseAlerts(userId);

  const [weather, setWeather] = useState(null)
  const [hourly, setHourly] = useState([])
  const [daily, setDaily] = useState([])
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState(null)

  // Crop management state
  const [crops, setCrops] = useState([])
  const [newCrop, setNewCrop] = useState("")
  const [cropLoading, setCropLoading] = useState(false)
  const [cropError, setCropError] = useState("")
  const navigate = useNavigate();

  // no animation initialization

  // Fetch crops from backend
  useEffect(() => {
    const fetchCrops = async () => {
      setCropLoading(true);
      setCropError("");
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const data = await res.json();
        setCrops(data);
      } catch (err) {
        setCropError('Failed to load crops');
      } finally {
        setCropLoading(false);
      }
    };
    fetchCrops();
  }, [navigate]);


  const handleAddCrop = async () => {
    if (!newCrop.trim()) return;
    setCropError("");
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
      handleAddCrop();
    }
  };

  // Remove crop from backend
  const handleRemoveCrop = async (idx) => {
    setCropError("");
    setCropLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const cropId = crops[idx]._id;
      const res = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete crop');
      setCrops(crops.filter((_, i) => i !== idx));
    } catch (err) {
      setCropError('Failed to delete crop');
    } finally {
      setCropLoading(false);
    }
  };

  // Fetch weather on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation not supported")
      setWeatherLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        fetch(
          `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${import.meta.env.VITE_WEATHER_API_KEY}&timesteps=1h,1d&units=metric`
        )
          .then((res) => res.json())
          .then((data) => {
            const current = data.timelines.hourly[0]
            setWeather({
              temp: current.values.temperature,
              desc: getWeatherDesc(current.values.weatherCode),
              icon: getWeatherIcon(current.values.weatherCode),
              time: current.time,
              humidity: current.values.humidity || null,
            })
            setHourly(data.timelines.hourly.slice(0, 6))
            setDaily(data.timelines.daily.slice(0, 7))
            setWeatherLoading(false)
          })
          .catch(() => {
            setWeatherError("Failed to fetch weather")
            setWeatherLoading(false)
          })
      },
      () => {
        setWeatherError("Location access denied")
        setWeatherLoading(false)
      }
    )
  }, [])

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
    }
    return map[code] || "Unknown"
  }

  // Weather code to icon (use openweathermap icons as fallback)
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
    }
    return map[code] || "01d"
  }

  // Format hour
  const formatHour = (iso) => {
    const date = new Date(iso)
    return date.getHours() + ":00"
  }
  // Format day
  const formatDay = (iso) => {
    const date = new Date(iso)
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }

  // Modern UI styles - Green theme to match other components
  const card =
    "bg-white sm:p-1 md:py-5 xl:py-6 rounded-md sm:px-1 md:px-3 xl:px-6 shadow shadow-sm shadow-gray-200 p-4  m-0"
  const sectionTitle =
    "text-xl font-bold text-gray-800 mb-2 tracking-tight"
  const subTitle =
    "text-md font-semibold text-gray-600 mb-2"
  const inputStyle =
    "border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition "
  const buttonStyle =
    "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
  const iconBox =
    "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow text-green-600 text-2xl"

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:px-1 md:px-4 mx:px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weather Widget */}
          <div className={`${card} w-full`}>
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
            <div className="mt-8">
              <WeatherAnalysis
                weather={weather}
                daily={daily}
                formatDay={formatDay}
                getWeatherDesc={getWeatherDesc}
              />
            </div>

          </div>





          {/* Crop Management */}
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
                onClick={handleAddCrop}
                className={`${buttonStyle} flex items-center gap-2`}
              >
                <FaPlus className="text-sm" /> {t('add')}
              </button>


            </div>


            <ul className="space-y-2 mt-4">
              {crops.length === 0 ? (
                <li className="text-center py-4 text-gray-500">{t('no_crops_added')}</li>
              ) : (
                crops.map((crop, idx) => (
                  <li key={idx} className={`flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 hover:shadow-md transition`}>
                    <span className="flex items-center gap-3">
                      <FaSeedling className="text-green-600" />
                      <div>
                        <span className="font-medium text-gray-800">{crop.name}</span>
                        {crop.status && (
                          <span className="text-xs text-gray-500 ml-2 px-2 py-1 bg-gray-100 rounded-full">({crop.status})</span>
                        )}
                      </div>
                    </span>
                    <button
                      onClick={() => handleRemoveCrop(idx)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-full transition"
                      title="Remove"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </li>
                ))
              )}
            </ul>

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
          </div>
        </div>

        {/* Weather Analysis Component */}
        {/* <div className="mt-8">
          <WeatherAnalysis
            weather={weather}
            daily={daily}
            formatDay={formatDay}
            getWeatherDesc={getWeatherDesc}
          />
        </div> */}

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

      </div>
    </div>
  )
}

export default Home;