import React, { useEffect, useState } from 'react'
import useDiseaseAlerts from './useDiseaseAlerts'
import WeatherAnalysis from './WeatherAnalysis'
import { Link, useNavigate } from 'react-router-dom'
import { FaCloudSun, FaSeedling, FaPlus, FaTrash } from "react-icons/fa"
import { useTranslation } from 'react-i18next'
// No animations or transitions: UI will render statically

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
      setCropError('Failed to add crop');
    } finally {
      setCropLoading(false);
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
          `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=thltkMYhfQUiGEr01K7HDwN5vEGq4fiW&timesteps=1h,1d&units=metric`
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

  // Modern UI styles - Black and Grey Theme with Animations
  const card =
    "rounded-2xl bg-gray-100 border border-gray-200 p-8 mb-8 "
  const sectionTitle =
    "text-2xl font-bold text-gray-800 mb-4 tracking-tight"
  const subTitle =
    "text-lg font-semibold text-gray-600 mb-2"
  const inputStyle =
    "border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-base"
  const buttonStyle =
    "bg-black text-white px-4 py-2 rounded-lg shadow"
  const iconBox =
    "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow text-blue-600 text-2xl mb-2"

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-2 md:px-0">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 min-h-96 md:grid-cols-2 gap-6 md:gap-8 ">
          {/* Weather Widget */}
          <div className={`${card} w-full min-h-60`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={iconBox}>
                <FaCloudSun />
              </div>
              <div>
                <h2 className={sectionTitle}>{t('weather')}</h2>
                <p className="text-gray-500 text-sm">{t('local_forecast')}</p>
              </div>
            </div>

            {/* Hourly Forecast */}
            {!weatherLoading && !weatherError && (
              <div className="mb-4">
                <div className={subTitle}>{t('next_hours')}</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {hourly.map((h, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-white/70 rounded-lg p-2 shadow min-w-[64px]">
                      <span className="font-semibold text-gray-700">{formatHour(h.time)}</span>
                      <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(h.values.weatherCode)}.png`} alt="" className="w-8 h-8" />
                      <span className="text-base font-bold text-gray-800">{Math.round(h.values.temperature)}°C</span>
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
                    <div key={idx} className="flex flex-col items-center bg-white/70 rounded-lg p-2 shadow min-w-[64px]">
                      <span className="font-semibold text-gray-700">{formatDay(d.time)}</span>
                      <img src={`https://openweathermap.org/img/wn/${getWeatherIcon(d.values.weatherCodeMax)}.png`} alt="" className="w-8 h-8" />
                      <span className="text-base font-bold text-gray-800">{Math.round(d.values.temperatureMax)}°C</span>
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
            {/* ...crop card content... */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow text-green-600 text-2xl mb-2">
                <FaSeedling />
              </div>
              <div>
                <h2 className={sectionTitle}>{t('my_crops')}</h2>
                <p className="text-gray-500 text-sm">{t('manage_fields')}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                placeholder={t('add').concat(' new crop')}
                className={inputStyle + " flex-1"}
              />
              <button
                onClick={handleAddCrop}
                className="bg-black  text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2 sm:w-auto justify-center"
              >
                <FaPlus className="text-sm" /> {t('add')}
              </button>


              <button>
                <Link
                  to="/crop-recommendation"
                  className="border border-gray-500 text-xs text-black rounded-lg p-3  font-medium flex items-center gap-2 sm:w-auto justify-center"
                >
                  {t('get_recommendation')}
                </Link>
              </button>
            </div>


            <ul className="space-y-2">
              {crops.map((crop, idx) => (
                <li key={idx} className={`flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200`}>
                  <span className="flex items-center gap-3">
                    <FaSeedling className="text-green-600 transform transition-transform duration-300 hover:scale-125" />
                    <div>
                      <span className="font-medium text-gray-800">{crop.name}</span>
                      <span className="text-xs text-gray-500 ml-2 px-2 py-1 bg-gray-100 rounded-full">({crop.status})</span>
                    </div>
                  </span>
                  <button
                    onClick={() => handleRemoveCrop(idx)}
                    className="text-red-500 p-2 rounded-full"
                    title="Remove"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Display Crop Error */}
            {cropError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-600">{cropError}</span>
              </div>
            )}

            {/* Show loading state for crop operations */}
            {cropLoading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-600">{t('processing_crop_operation')}</span>
              </div>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 w-full">
          <Link to="/disease-detection" className="">
            <div className="rounded-2xl shadow-lg bg-gray-100 border border-gray-200 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-search text-3xl text-blue-600 mb-4 transform transition-all duration-300 hover:scale-125 hover:rotate-12"></i>
              <h3 className="font-semibold text-lg mb-2">{t('disease_detection')}</h3>
              <p className="text-sm text-gray-600">
                {t('upload_plant_images')}
              </p>
            </div>
          </Link>
          <Link to="/crop-recommendation" className="">
            <div className="rounded-2xl shadow-lg bg-gray-100 border border-gray-200 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-leaf text-3xl text-green-600 mb-4 transform transition-all duration-300 hover:scale-125 hover:rotate-12"></i>
              <h3 className="font-semibold text-lg mb-2">{t('crop_recommendation')}</h3>
              <p className="text-sm text-gray-600">
                {t('get_best_crop_suggestions')}
              </p>
            </div>
          </Link>
          <Link to="/market-prices" className="">
            <div className="rounded-2xl shadow-lg bg-gray-100 border border-gray-200 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-rupee-sign text-3xl text-yellow-600 mb-4 transform transition-all duration-300 hover:scale-125 hover:rotate-12"></i>
              <h3 className="font-semibold text-lg mb-2">{t('market_prices')}</h3>
              <p className="text-sm text-gray-600">
                {t('stay_updated_with_latest_prices')}
              </p>
            </div>
          </Link>
          <Link to="/government-schemes" className="">
            <div className="rounded-2xl shadow-lg bg-gray-100 border border-gray-200 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-hand-holding-usd text-3xl text-purple-600 mb-4 transform transition-all duration-300 hover:scale-125 hover:rotate-12"></i>
              <h3 className="font-semibold text-lg mb-2">{t('government_schemes')}</h3>
              <p className="text-sm text-gray-600">
                {t('find_apply_agriculture_subsidy_schemes')}
              </p>
            </div>
          </Link>
        </div>

        {/* Smart Irrigation Insights */}
        <div className="mt-8">
          <div className="rounded-2xl shadow-lg bg-gray-100 border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-tint text-blue-600"></i>
              {t('smart_irrigation_insights')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">{t('soil_types')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('clay')}:</span>
                    <span className="text-blue-600 font-medium">{t('high_retention')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('sandy')}:</span>
                    <span className="text-yellow-600 font-medium">{t('low_retention')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('loamy')}:</span>
                    <span className="text-green-600 font-semibold">{t('optimal')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">{t('crop_water_needs')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('tomatoes')}:</span>
                    <span className="text-red-600 font-medium">25mm/{t('day')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('lettuce')}:</span>
                    <span className="text-green-600 font-medium">15mm/{t('day')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('corn')}:</span>
                    <span className="text-yellow-600 font-medium">30mm/{t('day')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">{t('alerts')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-orange-600 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    <span>{t('optimal_timing')}: 6-8 AM</span>
                  </div>
                  <div className="text-blue-600 flex items-center">
                    <i className="fas fa-cloud-rain mr-2"></i>
                    <span>{t('check_rain_forecast')}</span>
                  </div>
                  <div className="text-green-600 flex items-center">
                    <i className="fas fa-leaf mr-2"></i>
                    <span>{t('monitor_soil_moisture')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home;