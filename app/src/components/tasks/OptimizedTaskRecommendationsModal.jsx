import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';
import { toast } from 'react-toastify';
import { FaTimes, FaCheck, FaSave, FaCalendarAlt } from 'react-icons/fa';

/**
 * Modal component for displaying and saving AI-generated task recommendations
 */
const TaskRecommendationsModal = ({ isOpen, onClose, recommendations, cropId, onTaskSaved }) => {
  const { t } = useTranslation(['translation', 'tasks']);
  const [saving, setSaving] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [savedTaskIds, setSavedTaskIds] = useState([]);

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      console.error('Invalid date format:', e);
      return 'Invalid date';
    }
  };

  // Toggle task selection
  const handleToggleTask = (task) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter(t => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  // Select all tasks
  const handleSelectAll = () => {
    if (selectedTasks.length === recommendations.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks([...recommendations]);
    }
  };

  // Save selected tasks
  const handleSaveTasks = async () => {
    if (selectedTasks.length === 0) {
      toast.warning(t('no_tasks_selected', { ns: 'tasks' }));
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Process tasks one by one to show progress
      for (const task of selectedTasks) {
        if (savedTaskIds.includes(task.id)) continue;

        const taskData = {
          title: task.title,
          description: task.description,
          category: task.category,
          dueDate: task.dueDate || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          cropId: cropId,
          // Add any other fields needed
        };

        const res = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });

        if (!res.ok) {
          throw new Error(`Failed to save task: ${res.status}`);
        }

        const savedTask = await res.json();

        // Add to saved tasks list to prevent duplicate saves
        setSavedTaskIds(prev => [...prev, task.id]);

        // Notify parent component about the new task
        onTaskSaved(savedTask);
      }

      toast.success(t('tasks_saved_successfully', {
        count: selectedTasks.length,
        ns: 'tasks'
      }));

      // Clear selected tasks after saving
      setSelectedTasks([]);

    } catch (err) {
      console.error('Error saving tasks:', err);
      toast.error(t('failed_to_save_tasks', { ns: 'tasks' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {t('ai_task_recommendations', { ns: 'tasks' })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {recommendations.length === 0 ? (
            <p className="text-center text-gray-500">
              {t('no_recommendations_available', { ns: 'tasks' })}
            </p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {t('recommendations_count', {
                    count: recommendations.length,
                    ns: 'tasks'
                  })}
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedTasks.length === recommendations.length
                    ? t('deselect_all', { ns: 'tasks' })
                    : t('select_all', { ns: 'tasks' })
                  }
                </button>
              </div>

              <div className="space-y-3">
                {recommendations.map((task, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition ${selectedTasks.includes(task)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      } ${savedTaskIds.includes(task.id) ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`w-5 h-5 rounded flex items-center justify-center ${selectedTasks.includes(task)
                              ? 'bg-green-500 text-white'
                              : 'border border-gray-300'
                            }`}
                          disabled={savedTaskIds.includes(task.id)}
                        >
                          {selectedTasks.includes(task) && <FaCheck className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-medium">
                          {task.title}
                          {savedTaskIds.includes(task.id) && (
                            <span className="ml-2 text-sm text-green-600">
                              ({t('saved', { ns: 'tasks' })})
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className="capitalize">{task.category}</span>

                          {task.dueDate && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <FaCalendarAlt className="mr-1 w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            {t('close', { ns: 'tasks' })}
          </button>

          <button
            onClick={handleSaveTasks}
            disabled={selectedTasks.length === 0 || saving}
            className={`px-4 py-2 rounded flex items-center ${selectedTasks.length === 0 || saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            <FaSave className="mr-2" />
            {saving
              ? t('saving', { ns: 'tasks' })
              : t('save_selected_tasks', { count: selectedTasks.length, ns: 'tasks' })
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskRecommendationsModal;