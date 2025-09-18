const mongoose = require('mongoose');

/**
 * Task Schema - Represents a recommendation or action item for a specific crop
 * 
 * Tasks are generated based on crop data, weather conditions, disease detections, etc.
 * Users can mark tasks as Done or Skipped, with a complete history maintained
 */
const taskSchema = new mongoose.Schema({
  // References
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Task details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    enum: ['irrigation', 'fertilization', 'pest_control', 'disease_treatment',
      'harvesting', 'planting', 'pruning', 'soil_management', 'weather_response', 'general']
  },

  // Timeframes
  dueDate: {
    type: Date,
    required: true
  },
  recommendedTimeframe: {
    start: Date,
    end: Date
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'done', 'skipped'],
    default: 'pending'
  },
  completedDate: {
    type: Date
  },

  // Source and generation details
  source: {
    type: String,
    enum: ['system_generated', 'weather_alert', 'disease_detection', 'growth_stage', 'user_created'],
    default: 'system_generated'
  },
  generationFactors: {
    weather: {
      conditions: String,
      temperature: Number,
      rainfall: Number
    },
    cropStage: String,
    diseaseRisk: {
      disease: String,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }
  },

  // Related metadata
  relatedActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'image', 'document']
    }
  }],

  // Feedback for completed tasks
  feedback: {
    notes: String,
    effectiveness: {
      type: Number,
      min: 1,
      max: 5
    },
    images: [String] // URLs to result images
  }
}, { timestamps: true });

// Create indexes for better querying performance
taskSchema.index({ crop: 1, dueDate: 1, status: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });

module.exports = mongoose.model('Task', taskSchema);