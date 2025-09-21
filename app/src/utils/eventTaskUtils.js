import axios from 'axios';

/**
 * Utility to convert crop events to tasks and save them to MongoDB
 */
export const saveEventAsTask = async (cropId, userId, eventType, eventData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Create a standardized task object from the event data
    const task = {
      // userId is not needed as it's extracted from the auth token on the server
      crop: cropId, // Changed from cropId to crop to match backend expectations
      title: generateTaskTitle(eventType, eventData),
      description: generateTaskDescription(eventType, eventData),
      dueDate: eventData.date || new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      source: 'system_generated',
      category: mapEventTypeToCategory(eventType),
      tags: ['crop-event', eventType],
    };

    // Send the task to the server
    const response = await axios.post('http://localhost:5000/api/tasks', task, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Also save the event to the crop
    await saveEventToCrop(cropId, eventType, eventData, token);

    return response.data;
  } catch (error) {
    console.error('Error saving event as task:', error);
    if (error.response && error.response.data) {
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
};

/**
 * Save the event directly to the crop's specific event history collection
 */
const saveEventToCrop = async (cropId, eventType, eventData, token) => {
  try {
    // For activity type, we'll use the activities API route instead of crops
    if (eventType === 'activity') {
      const activityData = {
        cropId,
        title: eventData.title || 'Crop Activity',
        description: eventData.description || '',
        activityType: eventData.activityType || 'general',
        duration: eventData.duration || 0,
        date: eventData.date || new Date().toISOString().split('T')[0],
        personnel: eventData.personnel || [],
        tags: eventData.tags || []
      };

      await axios.post(`http://localhost:5000/api/activities`, activityData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return;
    }

    // Map event type to the appropriate endpoint based on the Crop model schema
    const endpointMap = {
      'irrigation': 'irrigation',
      'fertilization': 'fertilization',
      'pestDisease': 'pest-disease',
      'growth': 'growth',
      'harvest': 'harvest',
      'weather': 'weather',
      'cost': 'costs',     // Plural as per the endpoint
      'labor': 'labor',
      'note': 'notes',     // Plural as per the endpoint
    };

    const endpoint = endpointMap[eventType];
    if (!endpoint) {
      console.error(`Unknown event type: ${eventType}`);
      return;
    }

    // Format the event data - different endpoints expect different data structures
    // For simplicity, we'll just send the raw event data
    const event = {
      ...eventData,
      date: eventData.date || new Date().toISOString().split('T')[0]
    };

    await axios.post(`http://localhost:5000/api/crops/${cropId}/${endpoint}`, event, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error saving event to crop:', error);
    // We don't throw here to avoid preventing task creation if this fails
  }
};

/**
 * Generate a title for the task based on event type and data
 */
const generateTaskTitle = (eventType, eventData) => {
  switch (eventType) {
    case 'irrigation':
      return `Irrigation: ${eventData.method || 'Water'} ${eventData.amount ? `(${eventData.amount} units)` : ''}`;
    case 'fertilization':
      return `Fertilize: ${eventData.fertilizer || 'Apply fertilizer'}`;
    case 'pestDisease':
      return `Pest Control: ${eventData.pestType || 'Treat'} ${eventData.severity ? `(Severity: ${eventData.severity})` : ''}`;
    case 'growth':
      return `Growth Check: ${eventData.stage || 'Record measurements'}`;
    case 'harvest':
      return `Harvest: ${eventData.yield ? `${eventData.yield} units` : 'Collect crops'}`;
    case 'weather':
      return `Weather Action: ${eventData.eventType || 'Prepare for conditions'}`;
    case 'cost':
      return `Expense: ${eventData.category} - ₹${eventData.amount || '0'}`;
    case 'labor':
      return `Work: ${eventData.task || 'Perform labor'} (${eventData.hours || '0'} hours)`;
    case 'note':
      return `Note: ${eventData.text ? eventData.text.substring(0, 30) + (eventData.text.length > 30 ? '...' : '') : 'Review note'}`;
    case 'activity':
      return `Activity: ${eventData.title || eventData.activityType || 'Perform task'}`;
    default:
      return `Crop Task: ${eventType}`;
  }
};

/**
 * Generate a description for the task based on event type and data
 */
const generateTaskDescription = (eventType, eventData) => {
  // Start with any notes field
  let baseDescription = eventData.notes || '';

  // Add event-specific details
  switch (eventType) {
    case 'irrigation':
      return `${baseDescription}\n\nMethod: ${eventData.method || 'Not specified'}\nAmount: ${eventData.amount || 'Not specified'}\nWater source: ${eventData.waterSource || 'Not specified'}`;

    case 'fertilization':
      return `${baseDescription}\n\nFertilizer: ${eventData.fertilizer || 'Not specified'}\nAmount: ${eventData.amount || 'Not specified'}\nMethod: ${eventData.method || 'Not specified'}`;

    case 'pestDisease':
      return `${baseDescription}\n\nType: ${eventData.pestType || 'Not specified'}\nSeverity: ${eventData.severity || 'Not specified'}\nTreatment: ${eventData.treatment || 'Not specified'}`;

    case 'growth':
      return `${baseDescription}\n\nStage: ${eventData.stage || 'Not specified'}\nHeight: ${eventData.height || 'Not specified'}\nObservations: ${eventData.observations || 'None recorded'}`;

    case 'harvest':
      return `${baseDescription}\n\nYield: ${eventData.yield || 'Not specified'}\nQuality: ${eventData.quality || 'Not specified'}\nMethod: ${eventData.method || 'Not specified'}`;

    default:
      // For other event types, just return any notes or a generic message
      return baseDescription || `Task related to ${eventType} for the crop`;
  }
};

/**
 * Map event types to task categories based on the Task model's allowed values:
 * ['irrigation', 'fertilization', 'pest_control', 'disease_treatment',
 *  'harvesting', 'planting', 'pruning', 'soil_management', 'weather_response', 'general']
 */
const mapEventTypeToCategory = (eventType) => {
  switch (eventType) {
    case 'irrigation':
      return 'irrigation';
    case 'fertilization':
      return 'fertilization';
    case 'pestDisease':
      return 'pest_control';
    case 'growth':
      return 'general';
    case 'harvest':
      return 'harvesting';
    case 'weather':
      return 'weather_response';
    case 'cost':
      return 'general';
    case 'labor':
      return 'general';
    case 'note':
    case 'activity':
    default:
      return 'general';
  }
};