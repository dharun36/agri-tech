import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaTimes,
  FaClock,
  FaTint,
  FaLeaf,
  FaSeedling,
  FaBug,
  FaThermometerHalf,
  FaCalendarDay,
  FaArrowRight,
  FaFire,
  FaExclamationTriangle,
  FaStar,
  FaPlay,
  FaMagic,
  FaRocket,
  FaGem
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// Task priority levels
const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Task categories matching AgriTech project theme
const TASK_CATEGORIES = {
  IRRIGATION: {
    icon: FaTint,
    color: 'text-blue-600'
  },
  FERTILIZATION: {
    icon: FaLeaf,
    color: 'text-green-600'
  },
  PEST_CONTROL: {
    icon: FaBug,
    color: 'text-red-600'
  },
  MONITORING: {
    icon: FaSeedling,
    color: 'text-green-600'
  },
  HARVESTING: {
    icon: FaStar,
    color: 'text-yellow-600'
  },
  SOIL_MANAGEMENT: {
    icon: FaThermometerHalf,
    color: 'text-amber-600'
  },
  GENERAL: {
    icon: FaCalendarDay,
    color: 'text-gray-600'
  }
};

const TodayTasksWidget = ({ crops = [], onTaskComplete, refreshKey, onTaskClick }) => {
  const { t } = useTranslation();
  const [todayTasks, setTodayTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate realistic, practical farming tasks
  useEffect(() => {
    const generateRealisticTasks = () => {
      if (!crops || crops.length === 0) {
        setTodayTasks([]);
        return;
      }

      console.log('🔄 Generating realistic farming tasks for crops:', crops.length);

      const tasks = [];
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      crops.forEach(crop => {
        // Only generate tasks for active crops
        if (crop.status !== 'Growing' && crop.status !== 'Planning') {
          return;
        }

        const cropName = crop.name || crop.cropName;

        // 1. Irrigation Tasks - Check every 2-3 days based on real farming needs
        if (crop.status === 'Growing') {
          const lastWatered = crop.lastIrrigation ? new Date(crop.lastIrrigation) : null;
          const daysSinceWater = lastWatered
            ? Math.floor((today - lastWatered) / (1000 * 60 * 60 * 24))
            : 5; // Assume needs water if no record

          // Different crops have different water needs
          let waterInterval = 2; // Default 2 days
          if (cropName.toLowerCase().includes('rice') || cropName.toLowerCase().includes('paddy')) {
            waterInterval = 1; // Rice needs daily water
          } else if (cropName.toLowerCase().includes('wheat') || cropName.toLowerCase().includes('corn')) {
            waterInterval = 3; // Grains can go 3 days
          }

          if (daysSinceWater >= waterInterval) {
            tasks.push({
              id: `water-${crop._id}`,
              title: `Water ${cropName}`,
              description: lastWatered
                ? `Last watered ${daysSinceWater} days ago. Check soil moisture level first.`
                : 'Check soil moisture and water thoroughly if dry.',
              category: 'IRRIGATION',
              priority: daysSinceWater > waterInterval + 2 ? TASK_PRIORITY.HIGH : TASK_PRIORITY.MEDIUM,
              estimatedTime: '15-20 min',
              cropName: cropName,
              cropId: crop._id
            });
          }

          // 2. Fertilizer Tasks - Based on realistic crop growth cycles
          const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : null;
          const cropAge = plantingDate ? Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24)) : 0;

          // Apply fertilizer at key growth stages
          if (cropAge === 21 || cropAge === 45 || cropAge === 70) { // 3 weeks, 6 weeks, 10 weeks
            tasks.push({
              id: `fertilize-${crop._id}`,
              title: `Apply fertilizer to ${cropName}`,
              description: `Apply balanced NPK fertilizer (10:10:10). Crop is ${cropAge} days old.`,
              category: 'FERTILIZATION',
              priority: TASK_PRIORITY.MEDIUM,
              estimatedTime: '25-30 min',
              cropName: cropName,
              cropId: crop._id
            });
          }

          // 3. Weekly Pest Inspection - Monday is inspection day
          if (dayOfWeek === 1) { // Monday
            tasks.push({
              id: `inspect-${crop._id}`,
              title: `Weekly pest inspection - ${cropName}`,
              description: 'Check leaves (top and bottom), stems, and around the base for pests or diseases.',
              category: 'PEST_CONTROL',
              priority: TASK_PRIORITY.LOW,
              estimatedTime: '10-15 min',
              cropName: cropName,
              cropId: crop._id
            });
          }

          // 4. Harvest preparation - when getting close to harvest
          const harvestDate = crop.harvestDate ? new Date(crop.harvestDate) : null;
          if (harvestDate) {
            const daysToHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));
            if (daysToHarvest <= 7 && daysToHarvest > 0) {
              tasks.push({
                id: `harvest-prep-${crop._id}`,
                title: `Prepare for ${cropName} harvest`,
                description: `Harvest in ${daysToHarvest} days. Check crop maturity and prepare harvesting tools.`,
                category: 'HARVESTING',
                priority: TASK_PRIORITY.HIGH,
                estimatedTime: '30-45 min',
                cropName: cropName,
                cropId: crop._id
              });
            }
          }

          // 5. Weeding - Every 2 weeks
          if (cropAge > 0 && cropAge % 14 === 0) {
            tasks.push({
              id: `weed-${crop._id}`,
              title: `Remove weeds around ${cropName}`,
              description: 'Remove weeds that compete with your crop for nutrients and water.',
              category: 'MONITORING',
              priority: TASK_PRIORITY.MEDIUM,
              estimatedTime: '20-30 min',
              cropName: cropName,
              cropId: crop._id
            });
          }
        }

        // 6. Soil preparation for planning crops
        if (crop.status === 'Planning') {
          tasks.push({
            id: `prep-soil-${crop._id}`,
            title: `Prepare field for ${cropName}`,
            description: 'Clear weeds, till soil 6-8 inches deep, and add compost or organic matter.',
            category: 'SOIL_MANAGEMENT',
            priority: TASK_PRIORITY.MEDIUM,
            estimatedTime: '60-90 min',
            cropName: cropName,
            cropId: crop._id
          });
        }
      });

      // Sort by priority and limit to realistic number of daily tasks
      const priorityOrder = {
        [TASK_PRIORITY.HIGH]: 0,
        [TASK_PRIORITY.MEDIUM]: 1,
        [TASK_PRIORITY.LOW]: 2
      };

      tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      const finalTasks = tasks.slice(0, 6); // Max 6 tasks per day is realistic
      console.log('📋 Generated realistic farming tasks:', finalTasks);
      setTodayTasks(finalTasks);
    };

    generateRealisticTasks();
  }, [crops, refreshKey]);

  // Simple task completion handler
  const handleMarkAsDone = async (task) => {
    console.log('✅ Marking task as done:', task.title);
    setLoading(true);

    try {
      // Remove from today's tasks
      setTodayTasks(prev => prev.filter(t => t.id !== task.id));

      // Add to completed tasks
      setCompletedTasks(prev => [...prev, { ...task, completedAt: new Date() }]);

      // Call parent callback if provided
      if (onTaskComplete) {
        onTaskComplete(task);
      }

      toast.success(`Task completed: ${task.title}`);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error completing task.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    const baseClasses = "flex items-center px-2 py-1 rounded-full text-xs font-medium";

    switch (priority) {
      case TASK_PRIORITY.HIGH:
        return (
          <div className={`${baseClasses} bg-red-100 text-red-700`}>
            <FaExclamationTriangle className="mr-1" />
            High
          </div>
        );
      case TASK_PRIORITY.MEDIUM:
        return (
          <div className={`${baseClasses} bg-yellow-100 text-yellow-700`}>
            <FaFire className="mr-1" />
            Medium
          </div>
        );
      case TASK_PRIORITY.LOW:
        return (
          <div className={`${baseClasses} bg-green-100 text-green-700`}>
            <FaLeaf className="mr-1" />
            Low
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-700`}>
            <FaLeaf className="mr-1" />
            Normal
          </div>
        );
    }
  };

  const getCategoryInfo = (category) => {
    return TASK_CATEGORIES[category] || TASK_CATEGORIES.GENERAL;
  };

  if (loading && todayTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white mr-3">
            <FaSeedling className="text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Today's Farm Tasks
            </h3>
            <p className="text-green-600 text-sm font-medium">Loading recommendations...</p>
          </div>
        </div>

        <div className="flex justify-center items-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-green-600 absolute top-0 left-0"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden max-h-96">
      {/* Simplified compact header */}
      <div className="bg-green-50 border-b border-green-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white mr-3">
              <FaSeedling className="text-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Today's Tasks</h3>
              <p className="text-green-600 text-xs">Farm recommendations</p>
            </div>
          </div>

          <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {todayTasks.length}
          </div>
        </div>
      </div>

      {/* Scrollable content with max height */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {todayTasks.length === 0 ? (
          <div className="text-center py-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto mb-3">
              <FaCheckCircle className="text-lg" />
            </div>
            <h4 className="text-md font-bold text-gray-800 mb-1">All Tasks Complete!</h4>
            <p className="text-gray-600 text-sm">Your farm is up to date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task, index) => {
              const categoryInfo = getCategoryInfo(task.category);
              const IconComponent = categoryInfo.icon;

              return (
                <div
                  key={task.id || index}
                  className="bg-gray-50 rounded-lg border border-gray-100 p-3 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 ${categoryInfo.color} mr-3`}>
                        <IconComponent className="text-sm" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-gray-800 truncate">
                            {task.title}
                          </h4>
                          {getPriorityIcon(task.priority)}
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <FaClock className="mr-1" />
                            {task.estimatedTime}
                          </div>
                          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {task.cropName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact action button */}
                    <button
                      onClick={() => handleMarkAsDone(task)}
                      disabled={loading}
                      className="ml-3 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Mark as Complete"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      ) : (
                        <FaCheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Simplified completed tasks section */}
        {completedTasks.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
              <FaCheckCircle className="text-green-600 mr-2 text-sm" />
              Completed Today ({completedTasks.length})
            </h4>

            <div className="space-y-2">
              {completedTasks.slice(0, 2).map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center justify-between bg-white p-2 rounded-lg text-sm"
                >
                  <span className="text-gray-700 line-through truncate">{task.title}</span>
                  <span className="text-green-600 text-xs ml-2">
                    {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {completedTasks.length > 2 && (
                <div className="text-center">
                  <span className="text-green-600 text-xs">
                    +{completedTasks.length - 2} more completed
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayTasksWidget;