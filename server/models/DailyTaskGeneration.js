const mongoose = require('mongoose');

/**
 * Daily Task Generation Schema - Tracks when daily tasks were generated
 * 
 * Ensures tasks are generated only once per day per user/farm
 * Maintains generation history and prevents duplicate daily task creation
 */
const dailyTaskGenerationSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Generation details
  date: {
    type: Date,
    required: true,
    // Store only date part (without time) for consistent daily checking
    set: function(date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Set to start of day
      return d;
    }
  },
  
  // Generated tasks count and IDs
  tasksGenerated: {
    type: Number,
    default: 0
  },
  taskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],

  // Generation context
  cropsProcessed: [{
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop'
    },
    cropName: String,
    tasksCreated: Number
  }],

  // Generation factors that influenced task creation
  generationContext: {
    weather: {
      conditions: String,
      temperature: Number,
      rainfall: Number
    },
    seasonalFactors: String,
    farmingPhase: String // planting, growing, harvesting, etc.
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'partial', 'failed'],
    default: 'completed'
  },
  
  // Completion tracking
  completedTasks: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  }

}, { 
  timestamps: true,
  // Add virtual for completion percentage
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion percentage
dailyTaskGenerationSchema.virtual('completionPercentage').get(function() {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.completedTasks / this.totalTasks) * 100);
});

// Create compound index to ensure one generation per user per day
dailyTaskGenerationSchema.index({ user: 1, date: 1 }, { unique: true });

// Additional indexes for efficient querying
dailyTaskGenerationSchema.index({ date: 1, status: 1 });
dailyTaskGenerationSchema.index({ user: 1, createdAt: -1 });

// Static method to check if tasks were already generated for today
dailyTaskGenerationSchema.statics.isGeneratedToday = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const generation = await this.findOne({
    user: userId,
    date: today,
    status: 'completed'
  });
  
  return !!generation;
};

// Static method to get today's generation record
dailyTaskGenerationSchema.statics.getTodaysGeneration = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await this.findOne({
    user: userId,
    date: today
  }).populate('taskIds');
};

module.exports = mongoose.model('DailyTaskGeneration', dailyTaskGenerationSchema);