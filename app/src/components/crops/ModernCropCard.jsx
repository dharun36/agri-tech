import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  FaLeaf,
  FaCalendarAlt,
  FaTint,
  FaRupeeSign,
  FaPlus,
  FaEllipsisH,
  FaSeedling,
  FaClipboardList
} from 'react-icons/fa';

/**
 * A clean, modern crop card component with essential crop information and quick action buttons
 */
const ModernCropCard = ({ crop, onAddEvent, onViewDetails }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return t('not_set');
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Status badge with appropriate coloring
  const renderStatusBadge = (status) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";

    switch (status) {
      case 'Growing':
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case 'Harvested':
        bgColor = "bg-amber-100";
        textColor = "text-amber-800";
        break;
      case 'Planning':
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case 'Failed':
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      case 'Completed':
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
    }

    return (
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded-full text-xs font-medium`}>
        {status}
      </span>
    );
  };

  // Calculate days since planting
  const getDaysSincePlanting = (plantingDate) => {
    if (!plantingDate) return null;
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffTime = Math.abs(today - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Quick action buttons
  const renderQuickActions = () => {
    const commonButtonClasses = "flex items-center justify-center p-2 rounded-full text-white";
    return (
      <div className="absolute bottom-0 right-0 p-2 bg-white rounded-tl-xl shadow-md flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddEvent(crop._id, 'irrigation');
          }}
          className={`${commonButtonClasses} bg-blue-500 hover:bg-blue-600`}
          title={t('add_irrigation')}
        >
          <FaTint size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddEvent(crop._id, 'cost');
          }}
          className={`${commonButtonClasses} bg-amber-500 hover:bg-amber-600`}
          title={t('add_expense')}
        >
          <FaRupeeSign size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className={`${commonButtonClasses} bg-gray-500 hover:bg-gray-600`}
          title={t('more_actions')}
        >
          <FaEllipsisH size={14} />
        </button>
      </div>
    );
  };

  // Action menu
  const renderActionMenu = () => {
    if (!showActions) return null;

    return (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
        <div className="py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(crop._id);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('view_details')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddEvent(crop._id, 'note');
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('add_note')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddEvent(crop._id, 'activity');
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('add_activity')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/crops/${crop._id}`);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('go_to_crop_page')}
          </button>
        </div>
      </div>
    );
  };

  // Calculate total expenses for the crop
  const calculateTotalExpenses = () => {
    if (!crop.costs || crop.costs.length === 0) return 0;
    return crop.costs.reduce((total, cost) => total + (cost.amount || 0), 0);
  };

  // Get the next recommended action for this crop
  const getNextAction = () => {
    if (!crop.nextActions || crop.nextActions.length === 0) {
      return null;
    }
    return crop.nextActions[0];
  };

  const nextAction = getNextAction();
  const daysSincePlanting = getDaysSincePlanting(crop.plantingDate);

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition border border-gray-100 relative cursor-pointer"
      onClick={() => onViewDetails(crop._id)}
    >
      {/* Crop header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-full">
            <FaSeedling className="text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{crop.name}</h3>
            {crop.variety && (
              <p className="text-xs text-gray-500">{crop.variety}</p>
            )}
          </div>
        </div>
        {renderStatusBadge(crop.status)}
      </div>

      {/* Crop details */}
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('planted')}</p>
            <p className="text-gray-700">{formatDate(crop.plantingDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaClipboardList className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('days_growing')}</p>
            <p className="text-gray-700">{daysSincePlanting ? `${daysSincePlanting} ${t('days')}` : t('not_planted')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaRupeeSign className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('expenses')}</p>
            <p className="text-gray-700">₹{calculateTotalExpenses().toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaLeaf className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">{t('plants')}</p>
            <p className="text-gray-700">{crop.plantCount || 1}</p>
          </div>
        </div>
      </div>

      {/* Next action section */}
      {nextAction && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-1">{t('suggested_action')}:</p>
          <p className="text-sm text-blue-600 font-medium">{nextAction}</p>
        </div>
      )}

      {/* Quick actions */}
      {renderQuickActions()}
      {renderActionMenu()}
    </div>
  );
};

export default ModernCropCard;
