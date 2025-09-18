import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TaskItem from './TaskItem';
import {
  FaTasks,
  FaCalendarAlt,
  FaHistory,
  FaFilter,
  FaSync,
  FaSpinner
} from 'react-icons/fa';

/**
 * Task list component that displays today's tasks, upcoming tasks, and task history
 */
const TaskList = ({ cropId = null }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch tasks based on active tab and filters
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Determine API endpoint based on active tab
        let url = '';
        switch (activeTab) {
          case 'today':
            url = '/api/tasks/today';
            break;
          case 'upcoming':
            url = '/api/tasks/upcoming';
            break;
          case 'history':
            url = '/api/tasks/history';
            break;
          default:
            url = '/api/tasks';
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
        setTasks(activeTab === 'history' || activeTab === 'all' ? data.tasks : data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(t('failed_to_fetch_tasks', { ns: 'tasks' }));
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeTab, cropId, filterCategory, t]);

  // Generate new task recommendations
  const handleGenerateRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        includeWeather: true,
        includeGrowthStage: true,
        includeDisease: true
      };

      // Add crop ID if filtering for a specific crop
      if (cropId) {
        payload.cropId = cropId;
      }

      const res = await fetch('/api/tasks/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to generate recommendations: ${res.status}`);
      }

      const result = await res.json();

      // Refresh task list after generating recommendations
      if (result.success) {
        // Wait briefly to ensure tasks are saved in the database
        setTimeout(() => {
          // Reload tasks with current tab
          const currentTab = activeTab;
          setActiveTab('loading');
          setTimeout(() => setActiveTab(currentTab), 10);
        }, 500);
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(t('failed_to_generate_recommendations', { ns: 'tasks' }));
    } finally {
      setLoading(false);
    }
  };

  // Mark task as done
  const handleMarkDone = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/tasks/${taskId}/status`, {
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

      // Update local state to reflect the change
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'done', completedDate: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(t('failed_to_update_task'));
    }
  };

  // Mark task as skipped
  const handleMarkSkipped = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/tasks/${taskId}/status`, {
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

      // Update local state to reflect the change
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'skipped', completedDate: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(t('failed_to_update_task'));
    }
  };

  // Get filtered tasks based on category
  const getFilteredTasks = () => {
    if (filterCategory === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.category === filterCategory);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FaTasks className="mr-2 text-green-600" />
          {t('crop_tasks', { ns: 'tasks' })}
        </h2>

        <button
          onClick={handleGenerateRecommendations}
          disabled={loading}
          className="flex items-center bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition"
        >
          {loading ? <FaSpinner className="animate-spin mr-1" /> : <FaSync className="mr-1" />}
          {t('generate_recommendations', { ns: 'tasks' })}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'today' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('today')}
        >
          <span className="flex items-center">
            <FaTasks className="mr-1" />
            {t('today', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'upcoming' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span className="flex items-center">
            <FaCalendarAlt className="mr-1" />
            {t('upcoming', { ns: 'tasks' })}
          </span>
        </button>

        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent'}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="flex items-center">
            <FaHistory className="mr-1" />
            {t('history', { ns: 'tasks' })}
          </span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex items-center">
        <span className="mr-2 flex items-center text-sm">
          <FaFilter className="mr-1" />
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
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-6">
          <FaSpinner className="animate-spin text-green-600 text-3xl" />
        </div>
      )}

      {/* Tasks List */}
      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-6 text-gray-500">
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

      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {filteredTasks.map(task => (
            <TaskItem
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
  );
};

export default TaskList;