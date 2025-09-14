import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import Card from '../ui/Card';
import IconBox from '../ui/IconBox';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSeedling,
  faPlus,
  faTrashCan,
  faEye,
  faChartLine,
  faDroplet,
  faLeaf,
  faCalendarAlt,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const CropStatusBadge = ({ status }) => {
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
    <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
      {status}
    </span>
  );
};

const getLastIrrigationDate = (crop) => {
  if (!crop.irrigationHistory || crop.irrigationHistory.length === 0) {
    return null;
  }

  return new Date(
    Math.max(...crop.irrigationHistory.map(e => new Date(e.date).getTime()))
  );
};

const getLastFertilizationDate = (crop) => {
  if (!crop.fertilizationHistory || crop.fertilizationHistory.length === 0) {
    return null;
  }

  return new Date(
    Math.max(...crop.fertilizationHistory.map(e => new Date(e.date).getTime()))
  );
};

const getCurrentGrowthStage = (crop) => {
  if (!crop.growthHistory || crop.growthHistory.length === 0) {
    return null;
  }

  // Sort growth history by date descending
  const sortedHistory = [...crop.growthHistory].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sortedHistory[0].stage;
};

const formatDate = (date) => {
  if (!date) return 'Never';
  return format(date, 'MMM d, yyyy');
};

const CropCard = ({
  crops,
  newCrop,
  setNewCrop,
  onAddCrop,
  onRemoveCrop,
  loading,
  error
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedCrops, setExpandedCrops] = useState({});

  const toggleCropExpansion = (cropId) => {
    setExpandedCrops({
      ...expandedCrops,
      [cropId]: !expandedCrops[cropId]
    });
  };

  const viewCropDetails = (cropId) => {
    navigate(`/crops/${cropId}`);
  };

  return (
    <Card variant="gradient">
      <div className="flex items-center gap-4 mb-6">
        <IconBox variant="primary">
          <FontAwesomeIcon icon={faSeedling} />
        </IconBox>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('my_crops')}</h2>
          <p className="text-gray-500 text-sm">{t('manage_fields')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <Input
          value={newCrop}
          onChange={(e) => setNewCrop(e.target.value)}
          placeholder={t('add').concat(' new crop')}
          className="flex-1"
        />
        <Button
          onClick={onAddCrop}
          disabled={loading}
          className="w-full sm:w-auto justify-center"
        >
          <FontAwesomeIcon icon={faPlus} /> Add
        </Button>
        <Link to="/crop-recommendation">
          <Button
            variant="secondary"
            className="w-full sm:w-auto justify-center bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white"
          >
            <FontAwesomeIcon icon={faSeedling} />
            {t('get_recommendation')}
          </Button>
        </Link>
      </div>

      <ul className="space-y-4">
        {crops.map((crop) => (
          <li
            key={crop._id}
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow overflow-hidden"
          >
            {/* Crop header - always visible */}
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggleCropExpansion(crop._id)}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
                <span className="font-medium text-gray-800">{crop.name}</span>
                {crop.variety && <span className="text-xs text-gray-500">({crop.variety})</span>}
                <div className="ml-2">
                  <CropStatusBadge status={crop.status} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewCropDetails(crop._id);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title={t('view_details')}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCrop(crop._id);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title={t('remove')}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                />
              </div>
            </div>

            {/* Expanded crop details */}
            {expandedCrops[crop._id] && (
              <div className="px-4 py-3 bg-white border-t border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">{t('planting_date')}</div>
                      <div className="text-sm">
                        {crop.plantingDate
                          ? formatDate(new Date(crop.plantingDate))
                          : 'Not set'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faDroplet} className="text-blue-400" />
                    <div>
                      <div className="text-xs text-gray-500">{t('last_irrigation')}</div>
                      <div className="text-sm">
                        {formatDate(getLastIrrigationDate(crop))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLeaf} className="text-green-500" />
                    <div>
                      <div className="text-xs text-gray-500">{t('last_fertilization')}</div>
                      <div className="text-sm">
                        {formatDate(getLastFertilizationDate(crop))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} className="text-amber-500" />
                    <div>
                      <div className="text-xs text-gray-500">{t('growth_stage')}</div>
                      <div className="text-sm">
                        {getCurrentGrowthStage(crop)
                          ? t(getCurrentGrowthStage(crop))
                          : 'Not recorded'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-1">
                  <Button
                    onClick={() => viewCropDetails(crop._id)}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    {t('view_complete_details')}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Display Crop Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Show loading state for crop operations */}
      {loading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-600">Processing crop operation...</span>
        </div>
      )}
    </Card>
  );
};

export default CropCard;