import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  faFlask
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { format } from 'date-fns';

import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import CropStatusHistory from './CropStatusHistory';
import { EventFormSelector } from './CropEventForms';

const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeEventForm, setActiveEventForm] = useState(null);

  // Fetch crop details
  useEffect(() => {
    const fetchCrop = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`http://localhost:5000/api/crops/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCrop(response.data);
      } catch (err) {
        console.error('Error fetching crop details:', err);
        setError('Failed to load crop details');
      } finally {
        setLoading(false);
      }
    };

    fetchCrop();
  }, [id]);

  const handleAddEvent = (eventType) => {
    setActiveEventForm(eventType);
  };

  const handleSubmitEvent = async (eventType, formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Determine the endpoint based on eventType
      let endpoint;
      switch (eventType) {
        case 'irrigation':
          endpoint = `/api/crops/${id}/irrigation`;
          break;
        case 'fertilization':
          endpoint = `/api/crops/${id}/fertilization`;
          break;
        case 'pestDisease':
          endpoint = `/api/crops/${id}/pest-disease`;
          break;
        case 'growth':
          endpoint = `/api/crops/${id}/growth`;
          break;
        case 'harvest':
          endpoint = `/api/crops/${id}/harvest`;
          break;
        case 'weather':
          endpoint = `/api/crops/${id}/weather`;
          break;
        case 'cost':
          endpoint = `/api/crops/${id}/costs`;
          break;
        case 'labor':
          endpoint = `/api/crops/${id}/labor`;
          break;
        case 'note':
          endpoint = `/api/crops/${id}/notes`;
          break;
        default:
          throw new Error('Unknown event type');
      }

      const response = await axios.post(endpoint, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setCrop(response.data);
      setActiveEventForm(null);
    } catch (err) {
      console.error(`Error adding ${eventType} event:`, err);
      setError(`Failed to add ${eventType} event`);
    } finally {
      setLoading(false);
    }
  };

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
        <Button onClick={() => navigate('/home')} variant="primary">
          {t('back_to_dashboard')}
        </Button>
      </div>
    );
  }

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <Button
        onClick={() => navigate('/home')}
        variant="secondary"
        className="mb-4"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        {t('back_to_dashboard')}
      </Button>

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
                {t('planting_method')}
              </div>
              <div className="text-lg">
                {crop.plantingMethod
                  ? t(crop.plantingMethod.replace(' ', '_'))
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
                {crop.location?.name || crop.fieldId || 'N/A'}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faRulerCombined} className="mr-2" />
                {t('area')}
              </div>
              <div className="text-lg">
                {crop.location?.area
                  ? `${crop.location.area} ${crop.location.areaUnit || 'units'}`
                  : 'N/A'
                }
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-gray-500 mb-1">
                <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                {t('soil_type')}
              </div>
              <div className="text-lg">{crop.soilType || 'N/A'}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm text-gray-500">{t('previous_crop')}</div>
                <div>{crop.previousCrop || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('companion_crops')}</div>
                <div>
                  {crop.companionCrops && crop.companionCrops.length
                    ? crop.companionCrops.join(', ')
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('trap_crops')}</div>
                <div>
                  {crop.trapCrops && crop.trapCrops.length
                    ? crop.trapCrops.join(', ')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
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