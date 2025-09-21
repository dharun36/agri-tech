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
// Use environment variables for flexibility or hardcode the URL for development
const API_BASE_URL = 'http://localhost:5000';

const CropDetails = ({ initialCropData: propInitialCropData, cropId: propCropId }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['translation', 'tasks']);

  // Use the ID either from props or from URL params
  const id = propCropId || paramId;

  // Get initial crop data if available from props or router state
  const initialCropData = propInitialCropData || location.state?.cropInitialData || null;

  const [crop, setCrop] = useState(initialCropData);
  const [loading, setLoading] = useState(!initialCropData);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeEventForm, setActiveEventForm] = useState(null);

  // Fetch crop data if not provided in location state
  useEffect(() => {
    const fetchCropData = async () => {
      if (!initialCropData && id) {
        setLoading(true);
        setError(null);

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }

          const response = await fetch(`${API_BASE_URL}/api/crops/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch crop: ${response.status}`);
          }

          const cropData = await response.json();
          // Debug the notes format
          console.log('Crop Data Notes:', cropData.notes);
          // Make sure notes is properly formatted before setting state
          if (cropData.notes && typeof cropData.notes === 'object' && !Array.isArray(cropData.notes)) {
            // If it's a single object, convert it to an array for consistency
            cropData.notes = [cropData.notes];
          }
          setCrop(cropData);
        } catch (err) {
          console.error('Error fetching crop:', err);
          setError(`Failed to load crop details: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCropData();
  }, [id, initialCropData, navigate]);

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

        // Fetch crop details and activities
        const cropResponse = await axios.get(`${API_BASE_URL}/api/crops/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Crop data received:', cropResponse.data);

        // Initially set the crop data for immediate display
        setCrop(cropResponse.data);

        try {
          // Fetch activities for this crop
          const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/crop/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Activities data received:', activitiesResponse.data);

          // Assign activities to the crop object to be used by CropStatusHistory
          const cropWithActivities = {
            ...cropResponse.data,
            activities: activitiesResponse.data.activities || []
          };

          // Debug the notes format
          console.log('CropWithActivities Notes:', cropWithActivities.notes);

          // Make sure notes is properly formatted 
          if (cropWithActivities.notes && typeof cropWithActivities.notes === 'object' && !Array.isArray(cropWithActivities.notes)) {
            // If it's a single object, convert it to an array for consistency
            cropWithActivities.notes = [cropWithActivities.notes];
          }

          setCrop(cropWithActivities);
        } catch (activitiesError) {
          console.error('Error fetching activities:', activitiesError);
          // Still keep the crop data we successfully fetched
        }
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
        case 'cost':
          endpoint = `/api/crops/${cropId}/costs`; // Note: plural 'costs'
          break;
        case 'note':
          endpoint = `/api/crops/${cropId}/notes`; // Note: plural 'notes'
          break;
        default:
          // For other types, use the eventType directly (singular)
          endpoint = `/api/crops/${cropId}/${eventType.toLowerCase()}`;
      }

      console.log(`Preparing to submit ${eventType} event to endpoint: ${endpoint}`);

      // Build the full URL with base API URL
      const fullEndpoint = `${API_BASE_URL}${endpoint}`;
      console.log('Full API URL:', fullEndpoint);

      // For costs event, make sure data is formatted correctly
      if (eventType === 'cost') {
        console.log('Cost event data before submission:', updatedFormData);

        // Ensure required fields are present and correctly formatted for the server
        if (!updatedFormData.date || !updatedFormData.category || updatedFormData.amount === undefined) {
          throw new Error('Missing required fields for cost event: date, category, and amount are required');
        }

        // Check if category is one of the valid enum values
        const validCategories = ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'other'];
        if (!validCategories.includes(updatedFormData.category)) {
          console.error(`Invalid category value: ${updatedFormData.category}`);
          updatedFormData.category = 'other'; // Default to 'other' if invalid
        }

        // Make sure the data structure exactly matches what the server expects
        updatedFormData = {
          date: updatedFormData.date,
          category: updatedFormData.category,
          amount: parseFloat(updatedFormData.amount) || 0,
          description: updatedFormData.description || 'No description provided'
        };

        console.log('Reformatted cost event data:', updatedFormData);
      }

      // Make the API request with enhanced error handling
      try {
        console.log(`Sending POST request to ${fullEndpoint} with token: ${token ? 'Valid token' : 'No token'}`);
        console.log('Request payload:', JSON.stringify(updatedFormData));

        // For cost events, add extra debugging
        if (eventType === 'cost') {
          console.log('Cost event payload details:');
          console.log('- date:', updatedFormData.date, typeof updatedFormData.date);
          console.log('- category:', updatedFormData.category, typeof updatedFormData.category);
          console.log('- amount:', updatedFormData.amount, typeof updatedFormData.amount);
          console.log('- description:', updatedFormData.description, typeof updatedFormData.description);
        }

        const response = await axios.post(fullEndpoint, updatedFormData, {
          headers: { 'Authorization': `Bearer ${token}` }
        }); console.log('API response received:', response.status, response.data);

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

          // Special handling for 404 errors - likely due to wrong API URL
          if (apiError.response.status === 404) {
            errorMessage = `API endpoint not found. Ensure the server is running at ${API_BASE_URL}`;
            console.error(`404 Error: Check if server is running or if endpoint ${endpoint} is correct.`);
          } else if (apiError.response.status === 400 && eventType === 'cost') {
            // Special handling for cost validation errors
            errorMessage = `Error saving cost: ${apiError.response.data.message || 'Bad request'}`;
            console.error(`Cost event validation error: ${apiError.response.data.message}`);
            console.error('Request data was:', updatedFormData);
          } else {
            // Extract error message from response data
            errorMessage = apiError.response.data.error ||
              apiError.response.data.message ||
              `Error ${apiError.response.status}: Server error`;
          }

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
              {typeof crop.notes === 'string'
                ? crop.notes
                : Array.isArray(crop.notes)
                  ? crop.notes.map((note, i) => (
                    <div key={i} className="mb-2">
                      {typeof note === 'string' ? note : note.text || JSON.stringify(note)}
                    </div>
                  ))
                  : typeof crop.notes === 'object' && crop.notes !== null
                    ? (crop.notes.text || JSON.stringify(crop.notes))
                    : String(crop.notes)
              }
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