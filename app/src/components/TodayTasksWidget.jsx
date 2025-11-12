import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaTimes,
  FaHourglass,
  FaTint,
  FaLeaf,
  FaSeedling,
  FaBug,
  FaThermometerHalf,
  FaCalendarDay,
  FaStar,
  FaCheck,
  FaMagic
} from 'react-icons/fa';
import { MdCheckCircle } from "react-icons/md";
import { toast } from 'react-toastify';

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

  // Generate realistic, practical farming tasks - updated
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
            estimatedTime: '60-90 min',
            cropName: cropName,
            cropId: crop._id
          });
        }
      });

      // Limit to realistic number of daily tasks
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-h-[550px] w-full max-w-full">
      {/* Enhanced header with green colors and white background */}
      <div className="bg-white border-b border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mr-4">
              <FaLeaf className="text-green-600 text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
              <p className="text-green-600 text-sm">Farm recommendations</p>
            </div>
          </div>

          <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            {todayTasks.length}
          </div>
        </div>
      </div>

      {/* Scrollable content with height to match weather widget */}
      <div className="p-2 max-h-96 overflow-y-auto bg-white">
        {todayTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full text-green-600 mx-auto mb-4">
              <MdCheckCircle  className="text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">All Tasks Complete!</h4>
            <p className="text-gray-600">Your farm is up to date</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task, index) => {
              const categoryInfo = getCategoryInfo(task.category);
              const IconComponent = categoryInfo.icon;

              return (
                <div
                  key={task.id || index}
                  className="bg-white rounded-xl border border-gray-100 p-2 hover:shadow-lg hover:border-green-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Add crop element at top */}
                    <div className="w-full">
                      <div className="flex items-center justify-between pb-2">
                        <div className="text-sm bg-green-100 text-green-700 px-3 rounded-lg font-semibold">

                          {task.cropName}
                        </div>


                      </div>

                      <div className="flex items-start gap-4 flex-1">
                        {/* Enhanced category icon */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 border-green-100 ${categoryInfo.color} flex-shrink-0`}>
                          <IconComponent className="text-lg" />

                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Better typography hierarchy */}
                          <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">
                            {task.title}
                          </h4>

                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                        {/* Enhanced action button with proper alignment */}
                        <button
                          onClick={() => handleMarkAsDone(task)}
                          disabled={loading}
                          className="bg-transparent text-white p-2.5 transition-all duration-200 disabled:opacity-50 hover:scale-105 flex-shrink-0 hover:shadow-md flex items-center justify-center"
                          title="Mark as Complete"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (<MdCheckCircle className="text-green-500 w-8 h-8" />

                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced completed tasks section with green colors */}
        {completedTasks.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center">
              Completed Today ({completedTasks.length})
            </h4>

            <div className="space-y-3">
              {completedTasks.slice(0, 2).map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100 shadow-sm"
                >
                  <span className="text-gray-600 line-through font-medium truncate">{task.title}</span>
                  <span className="text-green-600 text-sm font-semibold ml-3 bg-green-100 px-2 py-1 rounded-lg">
                    {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {completedTasks.length > 2 && (
                <div className="text-center pt-2">
                  <span className="text-green-600 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
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