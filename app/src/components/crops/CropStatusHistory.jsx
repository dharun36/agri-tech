import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faLeaf,
  faBug,
  faRulerVertical,
  faWeightHanging,
  faMoneyBill,
  faBusinessTime,
  faNoteSticky,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import Card from '../ui/Card';
import Button from '../ui/Button';

const EventTypeIcons = {
  irrigation: faDroplet,
  fertilization: faLeaf,
  pestDisease: faBug,
  growth: faRulerVertical,
  harvest: faWeightHanging,

  cost: faMoneyBill,
  labor: faBusinessTime,
  note: faNoteSticky,
  activity: faClipboardCheck
};

const TabButton = React.memo(({ active, onClick, icon, label }) => (
  <button
    className={`px-4 py-2 flex items-center gap-2 rounded-md transition ${active ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    onClick={onClick}
  >
    <FontAwesomeIcon icon={icon} />
    <span>{label}</span>
  </button>
));

TabButton.displayName = 'TabButton';

const CropStatusHistory = React.memo(({ crop, onAddEvent, onRefreshActivities }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('irrigation');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoize tab change handler
  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    console.log('Manual refresh triggered');
    if (onRefreshActivities) {
      onRefreshActivities();
    }
  }, [onRefreshActivities]);

  // Helper function to get the appropriate data array based on the active tab
  const getActiveData = useCallback(() => {
    switch (activeTab) {
      case 'irrigation':
        return crop.irrigationHistory || [];
      case 'fertilization':
        return crop.fertilizationHistory || [];
      case 'pestDisease':
        return crop.pestDiseaseHistory || [];
      case 'growth':
        return crop.growthHistory || [];
      case 'harvest':
        return crop.harvestHistory || [];
      case 'cost':
        return crop.costs || [];
      case 'labor':
        return crop.laborHours || [];
      case 'note':
        // Handle both cases: if notes is an array, return it; if it's an object or string, wrap it in an array
        if (!crop.notes) return [];
        if (Array.isArray(crop.notes)) return crop.notes;
        return [crop.notes]; // Wrap in array if it's a single object or string
      case 'activity':
        // Handle both cases: if activities is an array, return it; if it's an object, wrap it in an array
        console.log('Activity tab - crop.activities:', crop.activities);
        console.log('Is array?', Array.isArray(crop.activities));
        console.log('Length:', crop.activities?.length);
        if (!crop.activities) return [];
        if (Array.isArray(crop.activities)) return crop.activities;
        return [crop.activities]; // Wrap in array if it's a single object
      default:
        return [];
    }
  }, [activeTab, crop]);

  // Memoize the active data to prevent unnecessary recalculations
  const activeData = useMemo(() => getActiveData(), [getActiveData]);

  // Render specific content based on the event type
  const renderEventContent = (event) => {
    switch (activeTab) {
      case 'irrigation':
        return (
          <>
            <div className="font-semibold">{event.method || 'Irrigation'}</div>
            <div>
              {event.amount && `${event.amount} ${event.amount === 1 ? 'liter' : 'liters'}`}
              {event.duration && ` for ${event.duration} minutes`}
            </div>
            {event.waterSource && <div>Source: {event.waterSource}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'fertilization':
        return (
          <>
            <div className="font-semibold">{event.type}</div>
            {event.product && <div>Product: {event.product}</div>}
            {event.npkRatio && <div>NPK: {event.npkRatio}</div>}
            {event.amount && <div>Amount: {event.amount}</div>}
            {event.applicationMethod && <div>Method: {event.applicationMethod}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'pestDisease':
        return (
          <>
            <div className="font-semibold">
              {event.name || `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} Issue`}
            </div>
            {event.severity && <div>Severity: {event.severity}/10</div>}
            {event.affectedArea && <div>Affected Area: {event.affectedArea}</div>}
            {event.treatment && (
              <div>
                Treatment: {event.treatment.product}
                {event.treatment.applicationDate && ` on ${format(new Date(event.treatment.applicationDate), 'MMM d, yyyy')}`}
              </div>
            )}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'growth':
        return (
          <>
            <div className="font-semibold">
              {event.stage ? event.stage.charAt(0).toUpperCase() + event.stage.slice(1) : 'Growth Record'}
            </div>
            {event.height && <div>Height: {event.height} cm</div>}
            {event.canopyWidth && <div>Canopy Width: {event.canopyWidth} cm</div>}
            {event.healthRating && <div>Health: {event.healthRating}/10</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'harvest':
        return (
          <>
            <div className="font-semibold">Harvest</div>
            {event.yield && <div>Yield: {event.yield} {event.yieldUnit || 'kg'}</div>}
            {event.quality && <div>Quality: {event.quality}</div>}
            {event.marketValue && <div>Value: ${event.marketValue.toFixed(2)}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );



      case 'cost':
        return (
          <>
            <div className="font-semibold">{event.category}</div>
            <div className="text-lg">₹{event.amount.toFixed(2)}</div>
            {event.description && <div>{event.description}</div>}
          </>
        );

      case 'labor':
        return (
          <>
            <div className="font-semibold">{event.task}</div>
            <div>{event.hours} hours</div>
            {event.personnel && <div>By: {event.personnel}</div>}
            {event.notes && <div className="text-gray-500">{event.notes}</div>}
          </>
        );

      case 'note':
        return (
          <>
            <div>{typeof event === 'object' ? (event.text || JSON.stringify(event)) : event}</div>
          </>
        );

      case 'activity':
        return (
          <>
            {!event || typeof event !== 'object' ? (
              <div>{String(event)}</div>
            ) : (
              <>
                <div className="font-semibold">{event.title || 'Activity'}</div>
                <div>{event.activityType && `Type: ${event.activityType}`}</div>
                {event.description && <div>{event.description}</div>}
                {event.duration && <div>Duration: {event.duration} minutes</div>}
                {event.personnel && Array.isArray(event.personnel) && event.personnel.length > 0 &&
                  <div>Personnel: {event.personnel.join(', ')}</div>}
                {event.tags && Array.isArray(event.tags) && event.tags.length > 0 &&
                  <div>Tags: {event.tags.join(', ')}</div>}
              </>
            )}
          </>
        );

      default:
        return <div>No data available</div>;
    }
  };

  // Get label for the add button based on active tab
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'irrigation': return t('crops.add_irrigation');
      case 'fertilization': return t('crops.add_fertilization');
      case 'pestDisease': return t('crops.add_pest_disease');
      case 'growth': return t('crops.add_growth_record');
      case 'harvest': return t('crops.add_harvest');
      case 'cost': return t('crops.add_cost');
      case 'labor': return t('crops.add_labor');
      case 'note': return t('crops.add_note');
      case 'activity': return t('crops.add_activity');
      default: return t('crops.add_event');
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-bold mb-4">{t('crops.crop_status_history')}</h2>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
        <TabButton
          active={activeTab === 'irrigation'}
          onClick={() => setActiveTab('irrigation')}
          icon={EventTypeIcons.irrigation}
          label={t('crops.irrigation')}
        />
        <TabButton
          active={activeTab === 'fertilization'}
          onClick={() => setActiveTab('fertilization')}
          icon={EventTypeIcons.fertilization}
          label={t('crops.fertilization')}
        />
        <TabButton
          active={activeTab === 'pestDisease'}
          onClick={() => setActiveTab('pestDisease')}
          icon={EventTypeIcons.pestDisease}
          label={t('crops.pests_diseases')}
        />
        <TabButton
          active={activeTab === 'growth'}
          onClick={() => setActiveTab('growth')}
          icon={EventTypeIcons.growth}
          label={t('crops.growth')}
        />
        <TabButton
          active={activeTab === 'harvest'}
          onClick={() => setActiveTab('harvest')}
          icon={EventTypeIcons.harvest}
          label={t('crops.harvest')}
        />

        <TabButton
          active={activeTab === 'cost'}
          onClick={() => setActiveTab('cost')}
          icon={EventTypeIcons.cost}
          label={t('crops.costs')}
        />
        <TabButton
          active={activeTab === 'labor'}
          onClick={() => setActiveTab('labor')}
          icon={EventTypeIcons.labor}
          label={t('crops.labor')}
        />
        <TabButton
          active={activeTab === 'note'}
          onClick={() => setActiveTab('note')}
          icon={EventTypeIcons.note}
          label={t('crops.notes')}
        />
        <TabButton
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          icon={EventTypeIcons.activity}
          label={t('crops.activities')}
        />
      </div>

      {/* Event timeline */}
      <div className="mb-4">
        {getActiveData().length === 0 ? (
          <div className="text-gray-500 text-center py-6">
            {t('crops.no_data_available')}
          </div>
        ) : (
          <div className="border-l-2 border-green-300 pl-4 ml-2">
            {getActiveData().map((event, index) => (
              <div key={index} className="mb-4 relative">
                <div className="absolute -left-6 w-4 h-4 rounded-full bg-green-500"></div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">
                    {event && event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}
                  </div>
                  {renderEventContent(event)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add event button */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={() => onAddEvent(activeTab)}
          variant="primary"
        >
          <FontAwesomeIcon icon={EventTypeIcons[activeTab]} className="mr-2" />
          {getAddButtonLabel()}
        </Button>
        
        {activeTab === 'activity' && (
          <Button
            onClick={handleRefresh}
            variant="secondary"
          >
            Refresh
          </Button>
        )}
      </div>
    </Card>
  );
});

CropStatusHistory.displayName = 'CropStatusHistory';

export default CropStatusHistory;