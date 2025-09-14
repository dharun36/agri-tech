import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Base form component for all event types
const EventFormBase = ({ title, children, onSubmit, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit}>
        {children}

        <div className="flex gap-3 mt-4">
          <Button type="submit" variant="primary">
            {t('save')}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// Common form fields
const DateField = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-3">
      <label className="block mb-1 text-sm font-medium">{t('date')}</label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
};

const NotesField = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-3">
      <label className="block mb-1 text-sm font-medium">{t('notes')}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        rows="3"
      />
    </div>
  );
};

// Irrigation Form
export const IrrigationForm = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '',
    amount: '',
    method: 'manual',
    waterSource: '',
    soilMoistureBefore: '',
    soilMoistureAfter: '',
    notes: ''
  });

  // Add validation state
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (field, value) => {
    // Clear validation error when field is changed
    const newErrors = { ...validationErrors };
    delete newErrors[field];
    setValidationErrors(newErrors);

    setFormData({ ...formData, [field]: value });
  };

  // Validate numeric field
  const validateNumeric = (value, fieldName) => {
    if (value === '' || value === undefined) return true;

    const num = Number(value);
    if (isNaN(num)) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} must be a valid number`
      }));
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields and numeric values
    const errors = {};
    if (!formData.date) errors.date = 'Date is required';

    // Validate numeric fields
    const fieldsToValidate = ['duration', 'amount', 'soilMoistureBefore', 'soilMoistureAfter'];
    let hasNumericError = false;

    fieldsToValidate.forEach(field => {
      if (!validateNumeric(formData[field], field)) {
        hasNumericError = true;
      }
    });

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0 || hasNumericError) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    // Ensure numeric fields are properly typed before submission
    const processedData = {
      ...formData,
      duration: formData.duration === '' ? undefined : Number(formData.duration),
      amount: formData.amount === '' ? undefined : Number(formData.amount),
      soilMoistureBefore: formData.soilMoistureBefore === '' ? undefined : Number(formData.soilMoistureBefore),
      soilMoistureAfter: formData.soilMoistureAfter === '' ? undefined : Number(formData.soilMoistureAfter)
    };

    console.log('Submitting irrigation data:', processedData);
    onSubmit(processedData);
  };

  return (
    <EventFormBase title={t('add_irrigation')} onSubmit={handleSubmit} onCancel={onCancel}>
      <DateField value={formData.date} onChange={(value) => handleChange('date', value)} />

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('irrigation_method')}</label>
        <select
          value={formData.method}
          onChange={(e) => handleChange('method', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="drip">{t('drip')}</option>
          <option value="sprinkler">{t('sprinkler')}</option>
          <option value="flood">{t('flood')}</option>
          <option value="manual">{t('manual')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('amount')} (L)</label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('duration')} (min)</label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('water_source')}</label>
        <Input
          type="text"
          value={formData.waterSource}
          onChange={(e) => handleChange('waterSource', e.target.value)}
          placeholder={t('water_source_placeholder')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('soil_moisture_before')}</label>
          <Input
            type="number"
            value={formData.soilMoistureBefore}
            onChange={(e) => handleChange('soilMoistureBefore', e.target.value)}
            placeholder="%"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('soil_moisture_after')}</label>
          <Input
            type="number"
            value={formData.soilMoistureAfter}
            onChange={(e) => handleChange('soilMoistureAfter', e.target.value)}
            placeholder="%"
          />
        </div>
      </div>

      <NotesField value={formData.notes} onChange={(value) => handleChange('notes', value)} />
    </EventFormBase>
  );
};

// Fertilization Form
export const FertilizationForm = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'NPK',
    product: '',
    npkRatio: '',
    amount: '',
    applicationMethod: 'soil',
    coverage: '',
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <EventFormBase title={t('add_fertilization')} onSubmit={handleSubmit} onCancel={onCancel}>
      <DateField value={formData.date} onChange={(value) => handleChange('date', value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('fertilizer_type')}</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="NPK">{t('npk')}</option>
            <option value="Organic">{t('organic')}</option>
            <option value="Foliar">{t('foliar')}</option>
            <option value="Compost">{t('compost')}</option>
            <option value="Other">{t('other')}</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('product_name')}</label>
          <Input
            type="text"
            value={formData.product}
            onChange={(e) => handleChange('product', e.target.value)}
            placeholder={t('product_name_placeholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">NPK {t('ratio')}</label>
          <Input
            type="text"
            value={formData.npkRatio}
            onChange={(e) => handleChange('npkRatio', e.target.value)}
            placeholder="20-20-20"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('amount')} (kg)</label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('application_method')}</label>
          <select
            value={formData.applicationMethod}
            onChange={(e) => handleChange('applicationMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="soil">{t('soil')}</option>
            <option value="foliar">{t('foliar')}</option>
            <option value="fertigation">{t('fertigation')}</option>
            <option value="other">{t('other')}</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('coverage')}</label>
          <Input
            type="text"
            value={formData.coverage}
            onChange={(e) => handleChange('coverage', e.target.value)}
            placeholder={t('coverage_placeholder')}
          />
        </div>
      </div>

      <NotesField value={formData.notes} onChange={(value) => handleChange('notes', value)} />
    </EventFormBase>
  );
};

// Pest & Disease Form
export const PestDiseaseForm = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'pest',
    name: '',
    severity: 5,
    affectedArea: '',
    treatment: {
      product: '',
      applicationDate: '',
      amount: '',
      method: ''
    },
    effectiveness: 5,
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTreatmentChange = (field, value) => {
    setFormData({
      ...formData,
      treatment: { ...formData.treatment, [field]: value }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <EventFormBase title={t('add_pest_disease')} onSubmit={handleSubmit} onCancel={onCancel}>
      <DateField value={formData.date} onChange={(value) => handleChange('date', value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('type')}</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="pest">{t('pest')}</option>
            <option value="disease">{t('disease')}</option>
            <option value="weed">{t('weed')}</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">{t('name')}</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('pest_disease_name_placeholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('severity')} (1-10)</label>
          <Input
            type="range"
            min="1"
            max="10"
            value={formData.severity}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('affected_area')}</label>
          <Input
            type="text"
            value={formData.affectedArea}
            onChange={(e) => handleChange('affectedArea', e.target.value)}
            placeholder={t('affected_area_placeholder')}
          />
        </div>
      </div>

      <h4 className="text-md font-medium mt-4 mb-2">{t('treatment')}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('product')}</label>
          <Input
            type="text"
            value={formData.treatment.product}
            onChange={(e) => handleTreatmentChange('product', e.target.value)}
            placeholder={t('treatment_product_placeholder')}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('application_date')}</label>
          <Input
            type="date"
            value={formData.treatment.applicationDate}
            onChange={(e) => handleTreatmentChange('applicationDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('amount')}</label>
          <Input
            type="text"
            value={formData.treatment.amount}
            onChange={(e) => handleTreatmentChange('amount', e.target.value)}
            placeholder={t('treatment_amount_placeholder')}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('method')}</label>
          <Input
            type="text"
            value={formData.treatment.method}
            onChange={(e) => handleTreatmentChange('method', e.target.value)}
            placeholder={t('treatment_method_placeholder')}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block mb-1 text-sm font-medium">{t('effectiveness')} (1-10)</label>
        <Input
          type="range"
          min="1"
          max="10"
          value={formData.effectiveness}
          onChange={(e) => handleChange('effectiveness', e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <NotesField value={formData.notes} onChange={(value) => handleChange('notes', value)} />
    </EventFormBase>
  );
};

// Growth Record Form
export const GrowthForm = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    stage: 'seedling',
    height: '',
    canopyWidth: '',
    images: [],
    healthRating: 5,
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <EventFormBase title={t('add_growth_record')} onSubmit={handleSubmit} onCancel={onCancel}>
      <DateField value={formData.date} onChange={(value) => handleChange('date', value)} />

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('growth_stage')}</label>
        <select
          value={formData.stage}
          onChange={(e) => handleChange('stage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="seedling">{t('seedling')}</option>
          <option value="vegetative">{t('vegetative')}</option>
          <option value="flowering">{t('flowering')}</option>
          <option value="fruiting">{t('fruiting')}</option>
          <option value="mature">{t('mature')}</option>
          <option value="harvested">{t('harvested')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">{t('height')} (cm)</label>
          <Input
            type="number"
            value={formData.height}
            onChange={(e) => handleChange('height', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">{t('canopy_width')} (cm)</label>
          <Input
            type="number"
            value={formData.canopyWidth}
            onChange={(e) => handleChange('canopyWidth', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block mb-1 text-sm font-medium">{t('health_rating')} (1-10)</label>
        <Input
          type="range"
          min="1"
          max="10"
          value={formData.healthRating}
          onChange={(e) => handleChange('healthRating', e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <div className="mt-3">
        <label className="block mb-1 text-sm font-medium">{t('images')}</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            // In a real app, this would upload the file to a server and store the URL
            console.log('Image would be uploaded here');
          }}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">{t('image_upload_note')}</p>
      </div>

      <NotesField value={formData.notes} onChange={(value) => handleChange('notes', value)} />
    </EventFormBase>
  );
};

// Forms for other event types can be implemented similarly

// ActivityForm component
const ActivityForm = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activityType: 'general',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    duration: '',
    personnel: [],
    tags: []
  });

  const activityTypes = [
    { value: 'general', label: t('activity_type_general') },
    { value: 'inspection', label: t('activity_type_inspection') },
    { value: 'maintenance', label: t('activity_type_maintenance') },
    { value: 'training', label: t('activity_type_training') },
    { value: 'pruning', label: t('activity_type_pruning') },
    { value: 'thinning', label: t('activity_type_thinning') },
    { value: 'mulching', label: t('activity_type_mulching') },
    { value: 'other', label: t('activity_type_other') }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonnelChange = (e) => {
    // Split by comma and trim each entry
    const personnel = e.target.value
      .split(',')
      .map(p => p.trim())
      .filter(p => p !== '');

    setFormData(prev => ({
      ...prev,
      personnel
    }));
  };

  const handleTagsChange = (e) => {
    // Split by comma and trim each entry
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <EventFormBase title={t('add_activity')} onSubmit={handleSubmit} onCancel={onCancel}>
      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('title')}</label>
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t('activity_title_placeholder')}
          required
        />
      </div>

      <DateField value={formData.date} onChange={(date) => setFormData(prev => ({ ...prev, date }))} />

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('activity_type')}</label>
        <select
          name="activityType"
          value={formData.activityType}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          {activityTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('description')}</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('activity_description_placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('duration')} ({t('minutes')})</label>
        <Input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          placeholder="60"
          min="0"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('personnel')}</label>
        <Input
          type="text"
          value={formData.personnel.join(', ')}
          onChange={handlePersonnelChange}
          placeholder={t('personnel_placeholder')}
        />
        <p className="text-xs text-gray-500 mt-1">{t('comma_separated')}</p>
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm font-medium">{t('tags')}</label>
        <Input
          type="text"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder={t('tags_placeholder')}
        />
        <p className="text-xs text-gray-500 mt-1">{t('comma_separated')}</p>
      </div>
    </EventFormBase>
  );
};

// EventFormSelector - A component that returns the appropriate form based on the event type
export const EventFormSelector = ({ eventType, onSubmit, onCancel }) => {
  switch (eventType) {
    case 'irrigation':
      return <IrrigationForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'fertilization':
      return <FertilizationForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'pestDisease':
      return <PestDiseaseForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'growth':
      return <GrowthForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'harvest':
      return <HarvestForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'weather':
      return <WeatherForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'cost':
      return <CostForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'labor':
      return <LaborForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'note':
      return <NoteForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'activity':
      return <ActivityForm onSubmit={onSubmit} onCancel={onCancel} />;
    default:
      return null;
  }
};