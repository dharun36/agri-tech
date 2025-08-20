import React from 'react';
import { useTranslation } from 'react-i18next'
import Card from '../ui/Card';
import IconBox from '../ui/IconBox';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const CropCard = ({
  crops,
  newCrop,
  setNewCrop,
  onAddCrop,
  onRemoveCrop,
  loading,
  error
}) => {
  const { t } = useTranslation()

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

      <ul className="space-y-2">
        {crops.map((crop, idx) => (
          <li key={idx} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg shadow">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
              <span className="font-medium text-gray-800">{crop.name}</span>
              <span className="text-xs text-gray-500">({crop.status})</span>
            </span>
            <button
              onClick={() => onRemoveCrop(idx)}
              className="text-xs text-red-500 hover:text-red-700 p-1"
              title={t('remove')}
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
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