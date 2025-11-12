import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaSeedling,
  FaTasks,
  FaLeaf,
  FaChevronRight,
  FaChevronLeft,
  FaSpinner
} from 'react-icons/fa';
import TaskList from './TaskList';
import useTaskGeneration from '../../hooks/useTaskGeneration';
import { translateCropName } from '../../utils/dbTranslations';
import i18n from '../../i18n';

/**
 * Multi-crop task dashboard component
 * Shows task management for multiple crops using tabs
 */
const TaskDashboard = () => {
  const { t } = useTranslation(['translation', 'tasks']);
  const navigate = useNavigate();
  const { cropId } = useParams(); // Get cropId from URL parameters
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCropIndex, setActiveCropIndex] = useState(0);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);

  // Task generation hook to watch for new task generation
  const { generationResult } = useTaskGeneration();

  // Get active crop ID for task filtering
  const activeCropId = useMemo(() => {
    if (crops.length === 0) return null;
    return crops[activeCropIndex]?._id;
  }, [crops, activeCropIndex]);

  // Fetch user's crops on mount - using useCallback to prevent unnecessary recreation
  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch crops: ${res.status}`);
      }

      const cropData = await res.json();
      setCrops(cropData);

      // If cropId is provided, set the active crop index accordingly
      if (cropId) {
        const cropIndex = cropData.findIndex(crop => crop._id === cropId);
          if (cropIndex >= 0) {
            setActiveCropIndex(cropIndex);
          }
        }
      } catch (err) {
        console.error('Error fetching crops:', err);
        setError(t('failed_to_fetch_crops', { ns: 'tasks' }));
      } finally {
        setLoading(false);
      }
    }, [navigate, t, cropId]);

    // Load crops on component mount
    useEffect(() => {
      fetchCrops();
    }, [fetchCrops]);

    // Watch for task generation results and refresh task list
    useEffect(() => {
      if (generationResult && generationResult.generated) {
        console.log('New tasks generated in dashboard, refreshing task list');
        setTaskRefreshTrigger(prev => prev + 1);
      }
    }, [generationResult]);

    // Navigate to previous crop
    const handlePrevCrop = () => {
      if (activeCropIndex > 0) {
        setActiveCropIndex(activeCropIndex - 1);
        // Update the URL to reflect the new crop
        navigate(`/tasks/${crops[activeCropIndex - 1]._id}`);
      } else {
        setActiveCropIndex(crops.length - 1); // Loop to last crop
        navigate(`/tasks/${crops[crops.length - 1]._id}`);
      }
    };

    // Navigate to next crop
    const handleNextCrop = () => {
      if (activeCropIndex < crops.length - 1) {
        setActiveCropIndex(activeCropIndex + 1);
        // Update the URL to reflect the new crop
        navigate(`/tasks/${crops[activeCropIndex + 1]._id}`);
      } else {
        setActiveCropIndex(0); // Loop back to first crop
        navigate(`/tasks/${crops[0]._id}`);
      }
    };

  // Define a consistent container style for all states
  const containerClass = "bg-white rounded-lg shadow-md min-h-[500px]";

  // Show loading state
  if (loading) {
    return (
      <div className={`${containerClass} p-6 flex justify-center items-center`}>
        <FaSpinner className="animate-spin text-green-600 text-3xl w-8 h-8" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className={`${containerClass} p-6`}>
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  // Show message if no crops are available
  if (crops.length === 0) {
    return (
      <div className={`${containerClass} p-6 text-center`}>
        <FaSeedling className="text-green-600 text-4xl mx-auto mb-4 w-16 h-16" />
        <h3 className="text-xl font-semibold mb-2">{t('no_crops_available', { ns: 'tasks' })}</h3>
        <p className="text-gray-600 mb-4">
          {t('add_crops_to_manage_tasks', { ns: 'tasks' })}
        </p>
      </div>
    );
  }

  // Get the currently active crop
  const activeCrop = crops[activeCropIndex];

  // Determine crop status icon and class
  const getCropStatusIcon = (status) => {
    switch (status) {
      case 'Growing':
        return <FaLeaf className="text-green-600" />;
      case 'Harvested':
        return <FaTasks className="text-orange-500" />;
      case 'Planning':
        return <FaSeedling className="text-blue-500" />;
      default:
        return <FaSeedling className="text-gray-500" />;
    }
  };

  return (
    <div className={containerClass}>
      {/* Crop Navigation Header */}
      <div className="flex justify-between items-center border-b p-4 h-[80px]">
        <div className="flex items-center w-1/4">
          <button
            onClick={handlePrevCrop}
            className="text-green-600 p-2 rounded-full hover:bg-green-50 disabled:text-gray-300 mr-2"
            disabled={crops.length <= 1}
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/tasks')}
            className="text-green-600 hover:text-green-800 text-sm flex items-center font-medium mr-4"
          >
            <FaTasks className="mr-1 w-4 h-4" /> {t('all_crops', { ns: 'tasks' })}
          </button>
        </div>

        <div className="text-center w-2/4 px-2">
          <h2 className="text-xl font-bold flex items-center justify-center">
            <div className="p-2 rounded-full bg-gray-50 mr-3 w-9 h-9 flex items-center justify-center flex-shrink-0">
              {getCropStatusIcon(activeCrop.status)}
            </div>
            <span className="mx-2 truncate">{activeCrop.name}</span>
            {activeCrop.variety && (
              <span className="text-sm text-gray-500 truncate">({activeCrop.variety})</span>
            )}
            <span className={`ml-2 text-xs px-2 py-1 rounded-full flex-shrink-0 ${activeCrop.status === 'Growing' ? 'bg-green-100 text-green-800' :
              activeCrop.status === 'Harvested' ? 'bg-orange-100 text-orange-800' :
                activeCrop.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
              }`}>
              {activeCrop.status}
            </span>
          </h2>
          <div className="text-xs text-gray-500 mt-1 truncate">
            {activeCrop.plantingDate && (
              <span>{t('planted', { ns: 'tasks' })}: {new Date(activeCrop.plantingDate).toLocaleDateString()}</span>
            )}
            {activeCrop.status === 'Growing' && activeCrop.harvestDate && (
              <span> • {t('expected_harvest', { ns: 'tasks' })}: {new Date(activeCrop.harvestDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="w-1/4 flex justify-end">
          <button
            onClick={handleNextCrop}
            className="text-green-600 p-2 rounded-full hover:bg-green-50 disabled:text-gray-300"
            disabled={crops.length <= 1}
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Crop Index Indicators (for multiple crops) */}
      {crops.length > 1 && (
        <div className="flex justify-center py-2 gap-1">
          {crops.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === activeCropIndex ? 'bg-green-600' : 'bg-gray-300'}`}
              onClick={() => {
                setActiveCropIndex(index);
                navigate(`/tasks/${crops[index]._id}`);
              }}
            />
          ))}
        </div>
      )}

      {/* Task List for Active Crop */}
      <TaskList cropId={activeCropId} refreshTrigger={taskRefreshTrigger} />
    </div>
  );
};

export default TaskDashboard;