import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowRight,
  FaWater,
  FaLeaf,
  FaBug,
  FaDisease,
  FaSeedling,
  FaCloudRain,
  FaTools,
  FaCalendarCheck
} from 'react-icons/fa';

/**
 * Individual task item component with status controls
 */
const TaskItem = ({ task, onMarkDone, onMarkSkipped, disabled = false }) => {
  const { t } = useTranslation(['translation', 'tasks']);

  // Get icon based on task category
  const getCategoryIcon = () => {
    switch (task.category) {
      case 'irrigation':
        return <FaWater className="text-blue-500" />;
      case 'fertilization':
        return <FaLeaf className="text-green-500" />;
      case 'pest_control':
        return <FaBug className="text-orange-500" />;
      case 'disease_treatment':
        return <FaDisease className="text-red-500" />;
      case 'planting':
        return <FaSeedling className="text-green-600" />;
      case 'weather_response':
        return <FaCloudRain className="text-blue-400" />;
      case 'harvesting':
        return <FaCalendarCheck className="text-yellow-600" />;
      default:
        return <FaTools className="text-gray-500" />;
    }
  };

  // Get priority class
  const getPriorityClass = () => {
    switch (task.priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Format due date
  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if task is due today
  const isToday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);

    return today.getTime() === dueDate.getTime();
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'skipped':
        return <FaTimesCircle className="text-red-500 text-xl" />;
      case 'pending':
      default:
        return isToday(task.dueDate)
          ? <FaExclamationTriangle className="text-orange-500 text-xl" />
          : <FaClock className="text-blue-500 text-xl" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 shadow-sm ${getPriorityClass()} min-h-[120px] flex flex-col`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center flex-grow">
          <span className="mr-2 w-5 h-5 flex items-center justify-center flex-shrink-0">{getCategoryIcon()}</span>
          <h3 className="font-medium truncate">{task.title}</h3>
        </div>
        <span className="flex-shrink-0">{getStatusIcon()}</span>
      </div>

      <p className="text-sm mb-3 line-clamp-2 overflow-hidden flex-grow">{task.description}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex-shrink-0">
          <span className="font-semibold">{t('due', { ns: 'tasks' })}: </span>
          <span className={isToday(task.dueDate) ? 'font-bold text-orange-600' : ''}>
            {isToday(task.dueDate) ? t('today', { ns: 'tasks' }) : formatDueDate(task.dueDate)}
          </span>
        </div>

        {task.crop && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded ml-2 truncate max-w-[120px] flex-shrink-0">
            {task.crop.name}
          </span>
        )}
      </div>

      {task.status === 'pending' && (
        <div className="mt-3 flex justify-end space-x-2">
          <button
            onClick={() => onMarkSkipped(task._id)}
            disabled={disabled}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded flex items-center text-sm"
          >
            <FaTimesCircle className="mr-1 w-3 h-3" />
            {t('skip', { ns: 'tasks' })}
          </button>

          <button
            onClick={() => onMarkDone(task._id)}
            disabled={disabled}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center text-sm"
          >
            <FaCheckCircle className="mr-1 w-3 h-3" />
            {t('mark_done', { ns: 'tasks' })}
          </button>
        </div>
      )}

      {/* Always reserve space for completion info to prevent layout shifts */}
      <div className="mt-2 text-xs text-right h-4">
        {(task.status === 'done' || task.status === 'skipped') && task.completedDate && (
          <>
            <span className="font-semibold">
              {task.status === 'done' ? t('completed', { ns: 'tasks' }) : t('skipped', { ns: 'tasks' })}:
            </span>
            {' '}
            {new Date(task.completedDate).toLocaleDateString()}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskItem;