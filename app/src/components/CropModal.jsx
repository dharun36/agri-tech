import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCheck,
  faCalendarAlt,
  faMapMarkerAlt,
  faSeedling,
  faWater,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import Button from './ui/Button';
import Input from './ui/Input';

const CropModal = ({ isOpen, onClose, onAddCrop, loading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    status: 'Growing',
    plantingDate: '',
    harvestDate: '',
    growthDays: '',
    seedSource: '',
    irrigationType: 'Drip',
    location: '',
    soilType: 'Loamy',
    previousCrop: '',
    notes: '',
  });

  // Get user location from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const userLocation = localStorage.getItem('userLocation') || '';
      if (userLocation && !formData.location) {
        setFormData(prev => ({
          ...prev,
          location: userLocation
        }));
      }
    }
  }, [isOpen]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'plantingDate' || name === 'growthDays') {
      // Calculate harvest date if both planting date and growth days are available
      const updatedFormData = { ...formData, [name]: value };

      if (name === 'plantingDate' && updatedFormData.growthDays) {
        // Calculate harvest date when planting date changes
        const plantingDate = new Date(value);
        if (!isNaN(plantingDate.getTime())) {
          const harvestDate = new Date(plantingDate);
          harvestDate.setDate(plantingDate.getDate() + parseInt(updatedFormData.growthDays, 10));
          updatedFormData.harvestDate = harvestDate.toISOString().split('T')[0];
        }
      } else if (name === 'growthDays' && updatedFormData.plantingDate) {
        // Calculate harvest date when growth days change
        const plantingDate = new Date(updatedFormData.plantingDate);
        if (!isNaN(plantingDate.getTime()) && value) {
          const harvestDate = new Date(plantingDate);
          harvestDate.setDate(plantingDate.getDate() + parseInt(value, 10));
          updatedFormData.harvestDate = harvestDate.toISOString().split('T')[0];
        }
      }

      setFormData(updatedFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = t('crop_name_required');
    }

    // Growth days should be a positive number if provided
    if (formData.growthDays) {
      const growthDays = parseInt(formData.growthDays, 10);
      if (isNaN(growthDays) || growthDays <= 0) {
        newErrors.growthDays = t('growth_days_positive');
      }
    }

    // Planting date is required if growth days are provided
    if (formData.growthDays && !formData.plantingDate) {
      newErrors.plantingDate = t('planting_date_required_for_growth');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Make sure harvest date is calculated if needed
      if (formData.plantingDate && formData.growthDays && !formData.harvestDate) {
        const plantingDate = new Date(formData.plantingDate);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(plantingDate.getDate() + parseInt(formData.growthDays, 10));

        const updatedFormData = {
          ...formData,
          harvestDate: harvestDate.toISOString().split('T')[0]
        };

        onAddCrop(updatedFormData);
      } else {
        onAddCrop(formData);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('add_new_crop')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information Section */}
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700 mb-2">
                {t('crop_basic_information')}
              </h3>
            </div>

            {/* Crop Name */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop_name')} *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('enter_crop_name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Crop Variety */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop_variety')}
              </label>
              <Input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                placeholder={t('enter_crop_variety')}
              />
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop_status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="Planning">{t('planning')}</option>
                <option value="Growing">{t('growing')}</option>
                <option value="Harvested">{t('harvested')}</option>
                <option value="Failed">{t('failed')}</option>
              </select>
            </div>

            {/* Irrigation Type */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faWater} className="mr-1 text-blue-500" />
                {t('irrigation_type')}
              </label>
              <select
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="Drip">{t('drip_irrigation')}</option>
                <option value="Sprinkler">{t('sprinkler_irrigation')}</option>
                <option value="Flood">{t('flood_irrigation')}</option>
                <option value="Manual">{t('manual_watering')}</option>
                <option value="Rainwater">{t('rainwater_only')}</option>
              </select>
            </div>

            {/* Dates Section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                {t('important_dates')}
              </h3>
            </div>

            {/* Planting Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('planting_date')}
              </label>
              <Input
                type="date"
                name="plantingDate"
                value={formData.plantingDate}
                onChange={handleChange}
              />
            </div>

            {/* Growth Days */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('growth_days')}
              </label>
              <Input
                type="number"
                name="growthDays"
                value={formData.growthDays}
                onChange={handleChange}
                placeholder={t('enter_growth_days')}
                min="1"
                className={errors.growthDays ? 'border-red-500' : ''}
              />
              {errors.growthDays && (
                <p className="text-red-500 text-xs mt-1">{errors.growthDays}</p>
              )}
              {formData.plantingDate && formData.growthDays && formData.harvestDate && (
                <p className="text-xs text-green-600 mt-1">
                  {t('estimated_harvest')}: {formData.harvestDate}
                </p>
              )}
            </div>

            {/* Location Section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                {t('location_details')}
              </h3>
            </div>

            {/* Location */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('field_location')}
              </label>
              <Input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t('enter_location')}
              />
            </div>

            {/* Soil Type */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faLeaf} className="mr-1 text-green-500" />
                {t('crop_soil_type')}
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="Loamy">{t('loamy')}</option>
                <option value="Clay">{t('clay')}</option>
                <option value="Sandy">{t('sandy')}</option>
                <option value="BlackCotton">{t('black_cotton')}</option>
                <option value="Aluvi">{t('aluvi')}</option>
                <option value="RedSoil">{t('red_soil')}</option>
              </select>
            </div>

            {/* Additional Information Section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faSeedling} className="mr-2" />
                {t('additional_information')}
              </h3>
            </div>

            {/* Seed Source */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('seed_source')}
              </label>
              <Input
                type="text"
                name="seedSource"
                value={formData.seedSource}
                onChange={handleChange}
                placeholder={t('enter_seed_source')}
              />
            </div>



            {/* Previous Crop (moved up) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop_previous')}
              </label>
              <Input
                type="text"
                name="previousCrop"
                value={formData.previousCrop}
                onChange={handleChange}
                placeholder={t('enter_previous_crop')}
              />
            </div>

            {/* Notes */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop_notes')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('enter_notes')}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block mr-2">⊚</span>
                  {t('saving')}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                  {t('save_crop')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropModal;