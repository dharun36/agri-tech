import React, { useEffect, useState } from 'react'
import useDiseaseAlerts from './useDiseaseAlerts'
import WeatherAnalysis from './WeatherAnalysis'
import { Link, useNavigate } from 'react-router-dom'
import { FaCloudSun, FaSeedling, FaPlus, FaTrash } from "react-icons/fa"

function Home() {
  // Get userId from localStorage (assuming user info is stored after login/signup)
  let userId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.id || user._id;
    }
  } catch { }

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

  // Modern UI styles
  const card =
    "rounded-2xl shadow-lg bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 p-8 mb-8"
  const sectionTitle =
    "text-2xl font-bold text-gray-800 mb-4 tracking-tight"
  const subTitle =
    "text-lg font-semibold text-gray-600 mb-2"
  const inputStyle =
    "border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition text-base"
  const buttonStyle =
    "bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:from-green-500 hover:to-green-700 transition font-semibold flex items-center gap-2"
  const iconBox =
    "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow text-yellow-600 text-2xl mb-2"

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white py-8 px-2 md:px-0">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Weather Widget */}
          <div className={`${card} w-full`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={iconBox}>
                <FaCloudSun />
              </div>
              <div>
                <h2 className={sectionTitle}>Weather</h2>
                <p className="text-gray-500 text-sm">Your local forecast</p>
              </div>
            </div>
            {weatherLoading ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded mb-4" />
            ) : weatherError ? (
              <span className="text-sm text-red-500">{weatherError}</span>
            ) : (
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt="weather"
                  className="w-14 h-14"
                />
                <div>
                  <div className="text-3xl font-bold text-gray-800">{Math.round(weather.temp)}°C</div>
                  <div className="text-gray-600 text-lg">{weather.desc}</div>
                  <div className="text-xs text-gray-400">{new Date(weather.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )}
            {/* Hourly Forecast */}
            {!weatherLoading && !weatherError && (
              <div className="mb-4">
                <div className={subTitle}>Next Hours</div>
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
                <div className={subTitle}>Next 7 Days</div>
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


          </div>





          {/* Crop Management */}
          <div className={`${card} w-full`}>
            {/* ...crop card content... */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-300 shadow text-green-600 text-2xl mb-2">
                <FaSeedling />
              </div>
              <div>
                <h2 className={sectionTitle}>My Crops</h2>
                <p className="text-gray-500 text-sm">Manage your fields</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <input
                type="text"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                placeholder="Add new crop"
                className={inputStyle + " flex-1"}
              />
              <button
                onClick={handleAddCrop}
                className={buttonStyle + " w-full sm:w-auto justify-center"}
              >
                <FaPlus /> Add
              </button>


              <button>
                <Link
                  to="/crop-recommendation"
                  className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow transition font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <FaSeedling />
                  Get Recommendation
                </Link>
              </button>
            </div>


            <ul className="space-y-2">
              {crops.map((crop, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg shadow">
                  <span className="flex items-center gap-2">
                    <FaSeedling className="text-green-600" />
                    <span className="font-medium text-gray-800">{crop.name}</span>
                    <span className="text-xs text-gray-500">({crop.status})</span>
                  </span>
                  <button
                    onClick={() => handleRemoveCrop(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Remove"
                  >
                    <FaTrash />
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
                <span className="text-sm text-blue-600">Processing crop operation...</span>
              </div>
            )}
          </div>
        </div>

        {/* Weather Analysis Component */}
        <div className="mt-8">
          <WeatherAnalysis
            weather={weather}
            daily={daily}
            formatDay={formatDay}
            getWeatherDesc={getWeatherDesc}
          />
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 w-full">
          <Link to="/disease-detection" className="transition hover:scale-105">
            <div className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-search text-3xl text-blue-600 mb-4"></i>
              <h3 className="font-semibold text-lg mb-2">Disease Detection</h3>
              <p className="text-sm text-gray-600">
                Upload plant images to detect diseases instantly using AI analysis.
              </p>
            </div>
          </Link>

          <Link to="/crop-recommendation" className="transition hover:scale-105">
            <div className="rounded-2xl shadow-lg bg-gradient-to-br from-green-50 to-white border border-green-100 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-leaf text-3xl text-green-600 mb-4"></i>
              <h3 className="font-semibold text-lg mb-2">Crop Recommendation</h3>
              <p className="text-sm text-gray-600">
                Get best crop suggestions based on soil type, season, and water availability.
              </p>
            </div>
          </Link>

          <Link to="/market-prices" className="transition hover:scale-105">
            <div className="rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-rupee-sign text-3xl text-yellow-600 mb-4"></i>
              <h3 className="font-semibold text-lg mb-2">Market Prices</h3>
              <p className="text-sm text-gray-600">
                Stay updated with the latest prices of crops in nearby markets.
              </p>
            </div>
          </Link>

          <Link to="/government-schemes" className="transition hover:scale-105">
            <div className="rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-6 text-center h-full flex flex-col items-center">
              <i className="fas fa-hand-holding-usd text-3xl text-purple-600 mb-4"></i>
              <h3 className="font-semibold text-lg mb-2">Government Schemes</h3>
              <p className="text-sm text-gray-600">
                Find and apply for agriculture-related subsidy schemes easily.
              </p>
            </div>
          </Link>
        </div>

        {/* Smart Irrigation Insights */}
        <div className="mt-8">
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-tint text-blue-600"></i>
              Smart Irrigation Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 mb-2">Soil Types</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Clay:</span>
                    <span className="text-blue-600">High retention</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sandy:</span>
                    <span className="text-yellow-600">Low retention</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loamy:</span>
                    <span className="text-green-600">Optimal</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 mb-2">Crop Water Needs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tomatoes:</span>
                    <span className="text-red-600">25mm/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lettuce:</span>
                    <span className="text-green-600">15mm/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corn:</span>
                    <span className="text-yellow-600">30mm/day</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-700 mb-2">Alerts</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-orange-600">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Optimal timing: 6-8 AM
                  </div>
                  <div className="text-blue-600">
                    <i className="fas fa-cloud-rain mr-2"></i>
                    Check rain forecast
                  </div>
                  <div className="text-green-600">
                    <i className="fas fa-leaf mr-2"></i>
                    Monitor soil moisture
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