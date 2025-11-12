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
  const [error, setError] = useState(null);

  // Fetch daily tasks from API - generated only once per day
  useEffect(() => {
    const fetchDailyTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching daily tasks from API...');

        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No auth token found');
          setTodayTasks([]);
          return;
        }

        const response = await fetch('/api/tasks/daily', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch daily tasks: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log(`📋 Retrieved ${data.tasks.length} daily tasks`, data);
          setTodayTasks(data.tasks || []);
          
          // Show generation status in console
          if (data.generated) {
            console.log('✨ New tasks generated for today');
          } else {
            console.log('♻️ Using existing tasks for today');
          }
        } else {
          throw new Error(data.message || 'Failed to get daily tasks');
        }

      } catch (err) {
        console.error('Error fetching daily tasks:', err);
        setError(err.message);
        setTodayTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyTasks();
  }, [refreshKey]); // Remove crops dependency - API will handle crop data

  // Task completion handler - now calls API to update database
  const handleMarkAsDone = async (task) => {
    console.log('✅ Marking task as done via API:', task.title);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`/api/tasks/${task._id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to complete task: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove from today's tasks
        setTodayTasks(prev => prev.filter(t => t._id !== task._id));

        // Add to completed tasks
        setCompletedTasks(prev => [...prev, { ...result.task, completedAt: new Date() }]);

        // Call parent callback if provided
        if (onTaskComplete) {
          onTaskComplete(result.task);
        }

        toast.success(result.message || `Task completed: ${task.title}`);
        console.log('✅ Task marked as complete:', result.task.title);
      } else {
        throw new Error(result.message || 'Failed to complete task');
      }

    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(`Error completing task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category) => {
    // Convert API category names to display format
    const categoryMapping = {
      'irrigation': 'IRRIGATION',
      'fertilization': 'FERTILIZATION', 
      'pest_control': 'PEST_CONTROL',
      'soil_management': 'SOIL_MANAGEMENT',
      'harvesting': 'HARVESTING',
      'general': 'GENERAL'
    };
    
    const displayCategory = categoryMapping[category] || category.toUpperCase();
    return TASK_CATEGORIES[displayCategory] || TASK_CATEGORIES.GENERAL;
  };

  // Show loading state while fetching from API
  if (loading && todayTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-h-[520px] w-full max-w-full">
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mr-4">
                <FaLeaf className="text-green-600 text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
                <p className="text-green-600 text-sm">Loading farm recommendations...</p>
              </div>
            </div>
            <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
              ...
            </div>
          </div>
        </div>
        
        <div className="p-5 max-h-96 overflow-y-auto bg-white">
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200"></div>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-green-600 absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if API call failed
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-h-[520px] w-full max-w-full">
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mr-4">
                <FaTimes className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
                <p className="text-red-600 text-sm">Failed to load tasks</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 max-h-96 overflow-y-auto bg-white">
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
              <FaTimes className="text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Tasks</h4>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
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
                  key={task._id || task.id || index}
                  className="bg-white rounded-xl border border-gray-100 p-2 hover:shadow-lg hover:border-green-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Add crop element at top */}
                    <div className="w-full">
                      <div className="flex items-center justify-between pb-2">
                        <div className="text-sm bg-green-100 text-green-700 px-3 rounded-lg font-semibold">
                          <FaSeedling className="inline mr-2 text-xs" />
                          {task.crop?.name || task.cropName || 'Unknown Crop'}
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
                          className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 flex-shrink-0 shadow-sm hover:shadow-md flex items-center justify-center"
                          title="Mark as Complete"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <FaCheck className="w-4 h-4" />
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