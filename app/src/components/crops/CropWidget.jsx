import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FaLeaf, FaCalendarAlt, FaMapMarkerAlt, FaLayerGroup, FaCloudSun, FaWater } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * A widget component for displaying crop information directly on the home page
 */
const CropWidget = ({ cropId, onClose }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch crop data
  useEffect(() => {
    const fetchCropData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch crop: ${response.status}`);
        }

        const cropData = await response.json();
        setCrop(cropData);
      } catch (err) {
        console.error('Error fetching crop:', err);
        setError(`Failed to load crop details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (cropId) {
      fetchCropData();
    }
  }, [cropId]);

  // Compact view - shows basic crop info
  const renderCompactView = () => {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-full">
            <FaLeaf className="text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{crop.name}</h3>
            <p className="text-sm text-gray-500">{t('plants')} {crop.plantCount || 1}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="text"
            onClick={() => setExpanded(true)}
            className="text-sm"
          >
            {t('view_details')}
          </Button>
        </div>
      </div>
    );
  };

  // Expanded view - shows more details
  const renderExpandedView = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{crop.name}</h3>
          <Button
            variant="text"
            onClick={() => setExpanded(false)}
            className="text-sm"
          >
            {t('collapse')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">{t('planted_on')}</p>
              <p className="text-sm">{format(new Date(crop.plantingDate), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FaMapMarkerAlt className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">{t('location')}</p>
              <p className="text-sm">{crop.location || t('not_specified')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FaLayerGroup className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">{t('soil_type')}</p>
              <p className="text-sm">{crop.soilType || t('not_specified')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FaWater className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">{t('water_source')}</p>
              <p className="text-sm">{crop.waterSource || t('not_specified')}</p>
            </div>
          </div>
        </div>

        {crop.status && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('current_status')}</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm">{crop.status}</p>
              {crop.statusDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(crop.statusDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="text-sm"
            >
              {t('close')}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="flex justify-center items-center p-6">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 text-red-600">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!crop) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 text-gray-600">
          <p>{t('no_crop_selected')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      {expanded ? renderExpandedView() : renderCompactView()}
    </Card>
  );
};

export default CropWidget;