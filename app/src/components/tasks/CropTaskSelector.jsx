import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSpinner, FaSeedling, FaTasks } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * CropTaskSelector component
 * 
 * This component displays a grid of all crops and allows users to select one to view tasks
 */
const CropTaskSelector = () => {
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all crops on component mount
  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch('http://localhost:5000/api/crops', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch crops: ${res.status}`);
        }

        const cropData = await res.json();
        setCrops(cropData);
      } catch (err) {
        console.error('Error fetching crops:', err);
        setError(t('failed_to_load_crops'));
        toast.error(t('failed_to_load_crops'));
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, [navigate, t]);

  // Determine crop status icon and class
  const getCropStatusIcon = (status) => {
    switch (status) {
      case 'Growing':
        return <FaSeedling className="text-green-600" />;
      case 'Harvested':
        return <FaTasks className="text-orange-500" />;
      case 'Planning':
        return <FaSeedling className="text-blue-500" />;
      default:
        return <FaSeedling className="text-gray-500" />;
    }
  };

  // Handle crop selection to view tasks
  const handleCropSelect = (cropId) => {
    navigate(`/tasks/${cropId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center">
        <FaSpinner className="animate-spin text-green-600 text-3xl" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  // Show message if no crops are available
  if (crops.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <FaSeedling className="text-green-600 text-4xl mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('no_crops_available', { ns: 'tasks' })}</h3>
        <p className="text-gray-600 mb-4">
          {t('add_crops_to_manage_tasks', { ns: 'tasks' })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{t('select_crop_for_tasks', { ns: 'tasks' })}</h2>
      <p className="text-gray-600 mb-4">{t('select_crop_to_view_tasks', { ns: 'tasks' })}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {crops.map(crop => (
          <div
            key={crop._id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCropSelect(crop._id)}
          >
            <div className="flex items-center">
              {getCropStatusIcon(crop.status)}
              <h3 className="text-lg font-semibold ml-2">{crop.name}</h3>
              {crop.variety && (
                <span className="ml-2 text-sm text-gray-500">({crop.variety})</span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {crop.plantingDate && (
                <div>{t('planted', { ns: 'tasks' })}: {new Date(crop.plantingDate).toLocaleDateString()}</div>
              )}
              {crop.status === 'Growing' && crop.harvestDate && (
                <div>{t('expected_harvest', { ns: 'tasks' })}: {new Date(crop.harvestDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropTaskSelector;