import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import TaskItem from './TaskItem';
import TaskSkeleton from './TaskSkeleton';
import TaskRecommendationsModal from './TaskRecommendationsModal';
import { toast } from 'react-toastify';
import {
  FaTasks,
  FaCalendarAlt,
  FaHistory,
  FaFilter,
  FaRobot,
  FaExclamationTriangle
} from 'react-icons/fa';

// Memoized task item component to prevent unnecessary re-renders
const MemoizedTaskItem = memo(TaskItem);

/**
 * Optimized Task List component with performance improvements
 */
const OptimizedTaskList = ({ cropId = null }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  // Cache the fetch tasks function to prevent recreating it on each render
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Determine API endpoint based on active tab
      let url = '';
      switch (activeTab) {
        case 'today':
          url = 'http://localhost:5000/api/tasks/today';
          break;
        case 'upcoming':
          url = 'http://localhost:5000/api/tasks/upcoming';
          break;
        case 'history':
          url = 'http://localhost:5000/api/tasks/history';
          break;
        default:
          url = 'http://localhost:5000/api/tasks';
      }

      // Add crop filter if provided
      if (cropId) {
        url += url.includes('?') ? `&cropId=${cropId}` : `?cropId=${cropId}`;
      }

      // Add category filter if selected
      if (filterCategory !== 'all') {
        url += url.includes('?') ? `&category=${filterCategory}` : `?category=${filterCategory}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }

      const data = await res.json();
      const newTasks = activeTab === 'history' || activeTab === 'all' ? data.tasks : data;

      setTasks(newTasks);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(t('failed_to_fetch_tasks', { ns: 'tasks' }));
      setLoading(false);
    }
  }, [activeTab, cropId, filterCategory, t]);

  // Effect to fetch tasks when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle marking task as done
  const handleMarkDone = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'done' })
      });

      if (!res.ok) {
        throw new Error(`Failed to update task status: ${res.status}`);
      }

      // Optimistic update - update UI immediately before refetching
      setTasks(prevTasks => prevTasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'done', completedDate: new Date().toISOString() }
          : task
      ));

      toast.success(t('task_marked_done', { ns: 'tasks' }));
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error(t('failed_to_update_task', { ns: 'tasks' }));
    }
  }, [t]);

  // Handle marking task as skipped
  const handleMarkSkipped = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'skipped' })
      });

      if (!res.ok) {
        throw new Error(`Failed to update task status: ${res.status}`);
      }

      // Optimistic update - update UI immediately before refetching
      setTasks(prevTasks => prevTasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'skipped', completedDate: new Date().toISOString() }
          : task
      ));

      toast.info(t('task_marked_skipped', { ns: 'tasks' }));
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error(t('failed_to_update_task', { ns: 'tasks' }));
    }
  }, [t]);

  // Handle task saved from recommendations modal
  const handleTaskSaved = useCallback((newTask) => {
    // If we're on the tab that should show this task, add it to the list
    const shouldAddToCurrentList =
      (activeTab === 'today' && new Date(newTask.dueDate).toDateString() === new Date().toDateString()) ||
      (activeTab === 'upcoming' && new Date(newTask.dueDate) > new Date());

    if (shouldAddToCurrentList) {
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }

    toast.success(t('task_saved_success', { ns: 'tasks' }));
  }, [activeTab, t]);

  // Generate task recommendations
  const handleGenerateRecommendations = useCallback(async () => {
    setIsGeneratingAI(true);
    setRecommendedTasks([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (!cropId) {
        toast.error(t('select_crop_first', { ns: 'tasks' }));
        return;
      }

      toast.info(t('generating_ai_recommendations', { ns: 'tasks' }));

      // Offload the heavy AI request to the backend
      const res = await fetch(`http://localhost:5000/api/tasks/recommendations/${cropId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to generate recommendations: ${res.status}`);
      }

      const data = await res.json();

      setRecommendedTasks(data.recommendations || []);
      toast.success(t('recommendations_generated', {
        count: data.recommendations.length,
        ns: 'tasks'
      }));
      setShowRecommendationsModal(true);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      toast.error(t('ai_recommendation_error', { ns: 'tasks' }));
    } finally {
      setIsGeneratingAI(false);
    }
  }, [cropId, t]);

  // Memoize filtered tasks to prevent unnecessary calculations
  const filteredTasks = useMemo(() => {
    if (filterCategory === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.category === filterCategory);
  }, [tasks, filterCategory]);

  return (
    <div className="bg-white rounded-lg shadow p-4 min-h-[400px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaTasks className="mr-2 text-green-600 w-5 h-5" />
          {t('crop_tasks', { ns: 'tasks' })}
        </h2>

        <button
          onClick={handleGenerateRecommendations}
          disabled={isGeneratingAI || loading}
          className={`flex items-center px-3 py-1 rounded-md text-sm transition ${isGeneratingAI || loading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
          <FaRobot className="mr-1 w-4 h-4" />
          {isGeneratingAI
            ? t('generating', { ns: 'tasks' })
            : t('generate_ai_recommendations', { ns: 'tasks' })
          }
        </button>
      </div>

      {/* Tab Navigation - Fixed height to prevent layout shifts */}
      <div className="flex border-b mb-4 h-[41px]">
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'today' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('today')}
        >
          <span className="flex items-center">
            <FaTasks className="mr-1 w-4 h-4" />
            {t('today', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'upcoming' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span className="flex items-center">
            <FaCalendarAlt className="mr-1 w-4 h-4" />
            {t('upcoming', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="flex items-center">
            <FaHistory className="mr-1 w-4 h-4" />
            {t('history', { ns: 'tasks' })}
          </span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex items-center">
        <span className="text-sm text-gray-600 mr-2 flex items-center">
          <FaFilter className="mr-1 w-3 h-3" />
          {t('filter', { ns: 'tasks' })}:
        </span>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">{t('all_categories', { ns: 'tasks' })}</option>
          <option value="irrigation">{t('irrigation', { ns: 'tasks' })}</option>
          <option value="fertilization">{t('fertilization', { ns: 'tasks' })}</option>
          <option value="pest_control">{t('pest_control', { ns: 'tasks' })}</option>
          <option value="disease_treatment">{t('disease_treatment', { ns: 'tasks' })}</option>
          <option value="harvesting">{t('harvesting', { ns: 'tasks' })}</option>
          <option value="planting">{t('planting', { ns: 'tasks' })}</option>
          <option value="pruning">{t('pruning', { ns: 'tasks' })}</option>
          <option value="soil_management">{t('soil_management', { ns: 'tasks' })}</option>
          <option value="weather_response">{t('weather_response', { ns: 'tasks' })}</option>
          <option value="general">{t('general', { ns: 'tasks' })}</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md mb-4 flex items-start">
          <FaExclamationTriangle className="text-red-600 mr-2 mt-1 flex-shrink-0 w-4 h-4" />
          <div>
            <p className="font-semibold">{t('error_occurred', { ns: 'tasks' })}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Content Area - Fixed Height Container */}
      <div className="min-h-[300px]">
        {/* Loading State with Skeleton UI */}
        {loading && (
          <div className="space-y-4">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-6 text-gray-500 min-h-[200px] flex flex-col items-center justify-center">
            {activeTab === 'today' && (
              <p>{t('no_tasks_today', { ns: 'tasks' })}</p>
            )}
            {activeTab === 'upcoming' && (
              <p>{t('no_upcoming_tasks', { ns: 'tasks' })}</p>
            )}
            {activeTab === 'history' && (
              <p>{t('no_task_history', { ns: 'tasks' })}</p>
            )}
            <button
              onClick={handleGenerateRecommendations}
              className="mt-2 text-green-600 underline"
            >
              {t('generate_new_recommendations', { ns: 'tasks' })}
            </button>
          </div>
        )}

        {/* Tasks List - Using Virtualized List for better performance with many items */}
        {!loading && filteredTasks.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {filteredTasks.map(task => (
              <MemoizedTaskItem
                key={task._id}
                task={task}
                onMarkDone={handleMarkDone}
                onMarkSkipped={handleMarkSkipped}
                disabled={loading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Recommendations Modal */}
      {showRecommendationsModal && (
        <TaskRecommendationsModal
          isOpen={showRecommendationsModal}
          onClose={() => setShowRecommendationsModal(false)}
          recommendations={recommendedTasks}
          cropId={cropId}
          onTaskSaved={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default OptimizedTaskList;