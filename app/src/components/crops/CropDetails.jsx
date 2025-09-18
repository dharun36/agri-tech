import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchWeatherData, getWeatherDesc, getWeatherIcon, formatDay } from '../../utils/weatherUtils';
import WeatherAnalysis from '../WeatherAnalysis';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLeaf,
  faSeedling,
  faCalendarAlt,
  faMapMarkerAlt,
  faRulerCombined,
  faLayerGroup,
  faCloudSun,
  faFlask,
  faWater,
  faClipboard
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import CropStatusHistory from './CropStatusHistory';
import { EventFormSelector } from './CropEventForms';
import { FaTasks, FaCloudSun, FaTemperatureHigh, FaTemperatureLow, FaWater, FaCalendarDay } from 'react-icons/fa';

// Define the API base URL to ensure all requests go to the backend server
// Use relative URLs to avoid hardcoding server address, 
// or use environment variables for flexibility
const API_BASE_URL = '';

const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['translation', 'tasks']);

  // Get initial crop data if available from router
  const initialCropData = location.state?.cropInitialData || null;

  const [crop, setCrop] = useState(initialCropData);
  const [loading, setLoading] = useState(!initialCropData);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeEventForm, setActiveEventForm] = useState(null);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Fetch weather data for the crop location
  useEffect(() => {
    if (crop && crop.fieldLocation && crop.fieldLocation.latitude && crop.fieldLocation.longitude) {
      setWeatherLoading(true);
      setWeatherError(null);

      const { latitude, longitude } = crop.fieldLocation;

      fetchWeatherData(latitude, longitude, import.meta.env.VITE_WEATHER_API_KEY)
        .then(({ weather, hourly, daily }) => {
          setWeather(weather);
          setHourly(hourly);
          setDaily(daily);
          setWeatherLoading(false);
        })
        .catch(error => {
          console.error("Weather fetch error:", error);
          setWeatherError("Failed to load weather data");
          setWeatherLoading(false);
        });
    }
  }, [crop]);

  // Fetch crop details and activities
  useEffect(() => {
    // Skip fetch if we already have data from the router
    if (initialCropData && !loading) return;

    const fetchCropDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch crop details
        console.log('Fetching crop details for ID:', id);

        // Add error handling for the API request
        try {
          const cropResponse = await axios.get(`${API_BASE_URL}/api/crops/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Crop data received:', cropResponse.data);
          setCrop(cropResponse.data);

          // Fetch activities for this crop
          const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/crop/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Activities data received:', activitiesResponse.data);
        } catch (apiError) {
          console.error('API error details:', apiError.response || apiError);
          throw apiError; // Re-throw for the outer catch to handle
        }

        // Assign activities to the crop object to be used by CropStatusHistory
        const cropWithActivities = {
          ...cropResponse.data,
          activities: activitiesResponse.data.activities || []
        };

        setCrop(cropWithActivities);
      } catch (err) {
        console.error('Error fetching crop details:', err);
        setError('Failed to load crop data');
      } finally {
        setLoading(false);
      }
    };

    fetchCropDetails();
  }, [id, navigate, initialCropData, loading]);

  const handleAddEvent = (eventType) => {
    setActiveEventForm(eventType);
  };

  const handleSubmitEvent = async (eventType, formData) => {
    try {
      setLoading(true);
      // Clear any existing messages
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');

      console.log('Submitting event:', eventType, 'with form data:', formData);

      // Prepare the request URL and data
      const cropId = id;
      let endpoint;
      let updatedFormData = { ...formData };

      // Handle special cases for different event types
      switch (eventType) {
        case 'activity':
          endpoint = `/api/activities`;
          updatedFormData.cropId = cropId;
          break;
        case 'pestDisease':
          endpoint = `/api/crops/${cropId}/pest-disease`;
          break;
        default:
          endpoint = `/api/crops/${cropId}/${eventType.toLowerCase()}`;
      }

      console.log(`Preparing to submit ${eventType} event to endpoint: ${endpoint}`);

      // Build the full URL with base API URL
      const fullEndpoint = `${API_BASE_URL}${endpoint}`;
      console.log('Full API URL:', fullEndpoint);

      // Make the API request with enhanced error handling
      try {
        const response = await axios.post(fullEndpoint, updatedFormData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('API response received:', response.status);

        // Update local state
        setCrop(response.data);
        setActiveEventForm(null);

        // Show success message
        setSuccess(`Successfully added ${eventType} event`);
      } catch (apiError) {
        console.error(`API error for ${eventType} event:`, apiError);

        // Extract and format detailed error information
        let errorMessage;
        let errorDetails = '';

        if (apiError.response) {
          // Server responded with non-2xx status
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', apiError.response.data);

          // Extract error message from response data
          errorMessage = apiError.response.data.error ||
            apiError.response.data.message ||
            `Error ${apiError.response.status}: Server error`;

          // Handle validation errors
          if (apiError.response.data.errors) {
            errorDetails = Object.entries(apiError.response.data.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('; ');
          }
        } else if (apiError.request) {
          // Request made but no response received
          console.error('No response received:', apiError.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Error setting up the request
          errorMessage = apiError.message || 'Unknown error occurred';
        }

        // Show comprehensive error to user
        const fullErrorMessage = errorDetails
          ? `${errorMessage} (${errorDetails})`
          : errorMessage;

        setError(`Failed to add ${eventType}: ${fullErrorMessage}`);
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (err) {
      console.error(`Error in event submission flow for ${eventType}:`, err);
      // This catch handles any errors not caught by the inner try-catch
    } finally {
      setLoading(false);
    }
  };

  // All activities are now handled through the standard event system
  // No separate activity handling functions needed

  if (loading && !crop) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => navigate('/home')} variant="primary">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-4">{t('crop_not_found')}</div>
        <p className="text-sm text-gray-500 mb-4">
          Crop ID: {id}<br />
          This crop might not exist or there might be a connection issue to the API.
        </p>
        <Button onClick={() => navigate('/home')} variant="primary">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  //hi
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => navigate('/home')}
          variant="secondary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t('back_to_dashboard')}
        </Button>

        <Button
          onClick={() => navigate(`/tasks/${id}`)}
          variant="primary"
          className="bg-green-600 hover:bg-green-700"
        >
          <FaTasks className="mr-2" />
          {t('crop_tasks_and_recommendations', { ns: 'tasks' })}
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700">
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700">
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Crop header */}
      <div className="bg-white border border-green-200 shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4">
            <FontAwesomeIcon icon={faSeedling} size="2x" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{crop.name}</h1>
            <div className="text-gray-600">
              {crop.variety ? `${crop.variety} · ` : ''}
              {t('status')}: <span className="text-green-600 font-medium">{t(crop.status.toLowerCase())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic crop information */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">{t('crop_information')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                {t('planting_date')}
              </div>
              <div className="text-lg">{formatDate(crop.plantingDate)}</div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                {t('expected_harvest')}
              </div>
              <div className="text-lg">{formatDate(crop.harvestDate)}</div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLeaf} className="mr-2" />
                {t('growth_days')}
              </div>
              <div className="text-lg">
                {crop.growthDays
                  ? `${crop.growthDays} ${t('days')}`
                  : 'N/A'
                }
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faWater} className="mr-2" />
                {t('irrigation_type')}
              </div>
              <div className="text-lg">
                {crop.irrigationType
                  ? t(crop.irrigationType.toLowerCase() + '_irrigation')
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                {t('field_location')}
              </div>
              <div className="text-lg">
                {crop.locationName || crop.fieldId || 'N/A'}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faRulerCombined} className="mr-2" />
                {t('area')}
              </div>
              <div className="text-lg">
                {crop.locationArea
                  ? `${crop.locationArea} ${crop.locationAreaUnit || 'units'}`
                  : 'N/A'
                }
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                {t('soil_type')}
              </div>
              <div className="text-lg">
                {crop.soilType
                  ? t(crop.soilType.toLowerCase())
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Additional crop details */}
        <div className="mt-4">
          <div className="flex items-center text-gray-500 mb-1">
            <FontAwesomeIcon icon={faCloudSun} className="mr-2" />
            {t('growing_conditions')}
          </div>
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-500">{t('previous_crop')}</div>
                <div>{crop.previousCrop || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('seed_source')}</div>
                <div>{crop.seedSource || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather information */}
        <div className="mt-4">
          <div className="flex items-center text-gray-500 mb-1">
            <FaCloudSun className="mr-2" />
            {t('weather_information')}
          </div>

          {weatherLoading ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="medium" />
            </div>
          ) : weatherError ? (
            <div className="text-center text-red-500 p-4">
              {weatherError}
            </div>
          ) : weather ? (
            <div>
              {/* Current Weather */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
                <div className="flex items-center">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.desc}
                    className="w-16 h-16"
                  />
                  <div className="ml-4">
                    <div className="text-2xl font-semibold">{Math.round(weather.temp)}°C</div>
                    <div className="text-gray-600 dark:text-gray-300">{weather.desc}</div>
                    <div className="text-gray-600 dark:text-gray-300">
                      <FaWater className="inline mr-1" /> {weather.humidity}% humidity
                    </div>
                  </div>
                </div>

                {/* 3-day forecast */}
                <div className="mt-4 border-t pt-3">
                  <div className="text-sm font-medium mb-2">{t('forecast')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {daily.slice(0, 3).map((day, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-xs">{formatDay(day.time)}</div>
                        <img
                          src={`https://openweathermap.org/img/wn/${getWeatherIcon(day.values.weatherCode)}@2x.png`}
                          alt={getWeatherDesc(day.values.weatherCode)}
                          className="w-10 h-10 mx-auto"
                        />
                        <div className="flex text-xs justify-center">
                          <span className="text-red-500 dark:text-red-400 mr-1">
                            {Math.round(day.values.temperatureMax)}°
                          </span>
                          <span className="text-blue-500 dark:text-blue-400">
                            {Math.round(day.values.temperatureMin)}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weather Analysis */}
              <WeatherAnalysis
                weather={weather}
                daily={daily}
                formatDay={formatDay}
                getWeatherDesc={getWeatherDesc}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">
              {t('no_weather_data')}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center text-gray-500 mb-1">
            <FontAwesomeIcon icon={faFlask} className="mr-2" />
            {t('growth_summary')}
          </div>
          <div className="mb-4">
            {crop.growthHistory && crop.growthHistory.length > 0 ? (
              <div className="text-lg">
                {t('current_stage')}: {
                  t(crop.growthHistory[crop.growthHistory.length - 1].stage || 'seedling')
                }
              </div>
            ) : (
              <div className="text-gray-500">{t('no_growth_records')}</div>
            )}
          </div>
        </div>

        {crop.notes && (
          <div className="mt-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FontAwesomeIcon icon={faClipboard} className="mr-2" />
              {t('crop_notes')}
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-gray-700">
              {crop.notes}
            </div>
          </div>
        )}
      </Card>

      {/* Crop Status History component */}
      <CropStatusHistory crop={crop} onAddEvent={handleAddEvent} />

      {/* Event form (conditionally rendered) */}
      {activeEventForm && (
        <EventFormSelector
          eventType={activeEventForm}
          onSubmit={(formData) => handleSubmitEvent(activeEventForm, formData)}
          onCancel={() => setActiveEventForm(null)}
        />
      )}
    </div>
  );
};

export default CropDetails;