const express = require('express');
const Task = require('../models/Task');
const Crop = require('../models/Crop');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { generateRecommendations, saveRecommendations, generateAllUserTaskRecommendations } = require('../utils/taskRecommendationGenerator');

const router = express.Router();

// All routes below require authentication
router.use(auth);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      cropId,
      dueAfter,
      dueBefore,
      priority,
      sort = 'dueDate',
      order = 'asc',
      limit = 50,
      skip = 0
    } = req.query;

    // Build query
    const query = {
      user: req.user._id,
      generationType: 'individual_task' // Only return individual tasks, not generation trackers
    };

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by category if provided
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Filter by crop if provided
    if (cropId) {
      query.crop = cropId;
    }

    // Filter by due date range if provided
    if (dueAfter || dueBefore) {
      query.dueDate = {};
      if (dueAfter) {
        query.dueDate.$gte = new Date(dueAfter);
      }
      if (dueBefore) {
        query.dueDate.$lte = new Date(dueBefore);
      }
    }

    // Filter by priority if provided
    if (priority) {
      query.priority = priority;
    }

    // Determine sort direction
    const sortDirection = order.toLowerCase() === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortDirection;

    // Fetch tasks with pagination
    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort(sortOptions)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/daily
 * @desc    Get or generate today's tasks for the authenticated user (once per day)
 * @access  Private
 */
router.get('/daily', async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if tasks were already generated today
    const todaysGeneration = await Task.getTodaysGeneration(userId);

    if (todaysGeneration && todaysGeneration.status === 'done') {
      // Tasks already generated today, return existing tasks
      const tasks = await Task.find({
        _id: { $in: todaysGeneration.dailyGeneration.taskIds },
        status: 'pending' // Only return pending tasks
      }).populate('crop', 'name variety status').sort({ priority: -1 });

      return res.json({
        success: true,
        tasks,
        generated: false,
        generatedAt: todaysGeneration.createdAt,
        totalGenerated: todaysGeneration.dailyGeneration.tasksGenerated,
        completionPercentage: todaysGeneration.completionPercentage
      });
    }

    // Tasks not generated today, generate new ones
    console.log('🔄 Generating daily tasks for user:', userId);

    // Get user's active crops
    const crops = await Crop.find({
      user: userId,
      status: { $in: ['Growing', 'Planning'] }
    });

    if (crops.length === 0) {
      return res.json({
        success: true,
        tasks: [],
        generated: false,
        message: 'No active crops found for task generation'
      });
    }

    // Generate tasks for today
    const tasks = [];
    const taskIds = [];
    const cropsProcessed = [];

    const today = new Date();
    const dayOfWeek = today.getDay();

    for (const crop of crops) {
      const cropTasks = await generateDailyTasksForCrop(crop, today, dayOfWeek);

      if (cropTasks.length > 0) {
        // Save tasks to database
        const savedTasks = await Task.insertMany(cropTasks);
        tasks.push(...savedTasks);
        taskIds.push(...savedTasks.map(task => task._id));

        cropsProcessed.push({
          cropId: crop._id,
          cropName: crop.name,
          tasksCreated: cropTasks.length
        });
      }
    }

    // Create generation tracking record
    const dailyGenerationTracker = new Task({
      user: userId,
      title: `Daily Generation - ${today.toDateString()}`,
      description: `Daily task generation tracking record`,
      category: 'general',
      dueDate: today,
      status: 'done', // Mark as done to indicate generation is complete
      generationType: 'daily_generation_tracker',
      dailyGeneration: {
        date: today,
        tasksGenerated: tasks.length,
        taskIds,
        cropsProcessed,
        totalTasks: tasks.length,
        completedTasks: 0
      }
    });

    await dailyGenerationTracker.save();

    // Populate crop data for response
    const populatedTasks = await Task.find({
      _id: { $in: taskIds }
    }).populate('crop', 'name variety status').sort({ priority: -1 });

    res.json({
      success: true,
      tasks: populatedTasks,
      generated: true,
      generatedAt: new Date(),
      totalGenerated: tasks.length,
      cropsProcessed: cropsProcessed.length
    });

  } catch (error) {
    console.error('Error getting/generating daily tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Helper function to generate daily tasks for a specific crop
 * Enhanced with activities data for smarter task generation
 */
async function generateDailyTasksForCrop(crop, today, dayOfWeek) {
  const tasks = [];
  const cropName = crop.name || crop.cropName;
  const userId = crop.user;

  // Get recent activities for this crop (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivities = await Activity.find({
    crop: crop._id,
    user: userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: -1 });

  // Helper function to get last activity of a type
  const getLastActivityOfType = (activityType) => {
    return recentActivities.find(activity =>
      activity.activityType === activityType ||
      activity.title.toLowerCase().includes(activityType.toLowerCase())
    );
  };

  // Helper function to check if activity happened recently
  const wasRecentlyDone = (activityType, daysThreshold = 7) => {
    const lastActivity = getLastActivityOfType(activityType);
    if (!lastActivity) return false;

    const daysSince = Math.floor((today - lastActivity.date) / (1000 * 60 * 60 * 24));
    return daysSince <= daysThreshold;
  };

  // 1. SMART IRRIGATION TASKS - Based on activities and crop data
  if (crop.status === 'Growing') {
    // Check for recent watering activities
    const lastWateringActivity = getLastActivityOfType('watering') ||
      getLastActivityOfType('irrigation') ||
      recentActivities.find(a => a.title.toLowerCase().includes('water'));

    const lastWatered = lastWateringActivity ? lastWateringActivity.date :
      (crop.lastIrrigation ? new Date(crop.lastIrrigation) : null);

    const daysSinceWater = lastWatered
      ? Math.floor((today - lastWatered) / (1000 * 60 * 60 * 24))
      : 5; // Assume needs water if no record

    // Crop-specific water intervals with weather consideration
    let waterInterval = 2;
    let waterAdvice = '';

    if (cropName.toLowerCase().includes('rice') || cropName.toLowerCase().includes('paddy')) {
      waterInterval = 1;
      waterAdvice = 'Keep water level 2-3 inches above soil. Rice requires constant moisture.';
    } else if (cropName.toLowerCase().includes('wheat') || cropName.toLowerCase().includes('corn') ||
      cropName.toLowerCase().includes('maize')) {
      waterInterval = 3;
      waterAdvice = 'Deep watering is better than frequent shallow watering for grain crops.';
    } else if (cropName.toLowerCase().includes('tomato') || cropName.toLowerCase().includes('pepper')) {
      waterInterval = 2;
      waterAdvice = 'Water at soil level to avoid wetting leaves and preventing disease.';
    } else if (cropName.toLowerCase().includes('lettuce') || cropName.toLowerCase().includes('spinach')) {
      waterInterval = 1;
      waterAdvice = 'Leafy greens need consistent moisture but avoid waterlogging.';
    } else {
      waterAdvice = 'Check soil moisture 2 inches deep - water if dry to touch.';
    }

    if (daysSinceWater >= waterInterval) {
      const urgency = daysSinceWater > waterInterval + 2 ? 'URGENT' : '';
      const lastWaterInfo = lastWateringActivity ?
        `Last watered on ${lastWateringActivity.date.toLocaleDateString()} (${daysSinceWater} days ago)` :
        `No recent watering recorded (${daysSinceWater} days since last irrigation)`;

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `${urgency ? urgency + ' - ' : ''}Water ${cropName}`,
        description: `🚿 IRRIGATION NEEDED\n\n📅 ${lastWaterInfo}\n\n💡 ${waterAdvice}\n\n🔍 Check: Soil moisture at root level, leaf drooping, and weather forecast before watering.`,
        category: 'irrigation',
        priority: daysSinceWater > waterInterval + 2 ? 'high' : 'medium',
        dueDate: today,
        source: 'system_generated',
        generationFactors: {
          cropStage: crop.status,
          weather: { daysSinceWater }
        }
      });
    }

    // 2. SMART FERTILIZER TASKS - Based on planting date and previous fertilization
    const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : null;
    const cropAge = plantingDate ? Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24)) : 0;

    const lastFertilizing = getLastActivityOfType('fertiliz');
    const daysSinceFertilizer = lastFertilizing ?
      Math.floor((today - lastFertilizing.date) / (1000 * 60 * 60 * 24)) : 999;

    // Growth stage-based fertilization with activity history
    if (cropAge > 0) {
      let shouldFertilize = false;
      let fertilizerType = '';
      let fertilizerReason = '';

      if ((cropAge === 21 || (cropAge >= 18 && cropAge <= 24)) && daysSinceFertilizer > 14) {
        shouldFertilize = true;
        fertilizerType = 'Nitrogen-rich fertilizer (21-0-0 or similar)';
        fertilizerReason = '3-week stage: Focus on leaf and stem development';
      } else if ((cropAge === 45 || (cropAge >= 42 && cropAge <= 48)) && daysSinceFertilizer > 20) {
        shouldFertilize = true;
        fertilizerType = 'Balanced NPK fertilizer (10-10-10)';
        fertilizerReason = '6-week stage: Support overall growth and prepare for flowering';
      } else if ((cropAge === 70 || (cropAge >= 67 && cropAge <= 73)) && daysSinceFertilizer > 25) {
        shouldFertilize = true;
        fertilizerType = 'Phosphorus-potassium fertilizer (0-20-20)';
        fertilizerReason = '10-week stage: Promote flowering and fruit development';
      }

      if (shouldFertilize) {
        const lastFertInfo = lastFertilizing ?
          `Last fertilized on ${lastFertilizing.date.toLocaleDateString()} (${daysSinceFertilizer} days ago)` :
          'No recent fertilization recorded';

        tasks.push({
          crop: crop._id,
          user: crop.user,
          title: `Apply fertilizer to ${cropName}`,
          description: `🌱 FERTILIZATION SCHEDULED\n\n📅 Crop age: ${cropAge} days old\n📊 ${lastFertInfo}\n\n💡 Recommended: ${fertilizerType}\n🎯 Purpose: ${fertilizerReason}\n\n📋 Apply early morning or evening, water lightly after application.`,
          category: 'fertilization',
          priority: 'medium',
          dueDate: today,
          source: 'system_generated',
          generationFactors: {
            cropStage: `${cropAge} days old`,
            weather: { daysSinceFertilizer }
          }
        });
      }
    }

    // 3. SMART PEST INSPECTION - Based on recent inspection history
    if (dayOfWeek === 1 || !wasRecentlyDone('inspection', 7)) {
      const lastInspection = getLastActivityOfType('inspection');
      const inspectionInfo = lastInspection ?
        `Last inspection: ${lastInspection.date.toLocaleDateString()}` :
        'No recent inspection recorded';

      // Crop-specific pest concerns
      let pestConcerns = '';
      if (cropName.toLowerCase().includes('tomato')) {
        pestConcerns = '🐛 Watch for: Hornworms, aphids, whiteflies\n🍄 Disease: Blight, fusarium wilt';
      } else if (cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('maize')) {
        pestConcerns = '🐛 Watch for: Corn borers, armyworms, cutworms\n🍄 Disease: Corn smut, leaf blight';
      } else if (cropName.toLowerCase().includes('rice')) {
        pestConcerns = '🐛 Watch for: Brown planthopper, rice bugs\n🍄 Disease: Blast, bacterial leaf blight';
      } else {
        pestConcerns = '🐛 Watch for: Aphids, spider mites, caterpillars\n🍄 Disease: Fungal spots, wilting';
      }

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Weekly pest inspection - ${cropName}`,
        description: `🔍 PEST & DISEASE INSPECTION\n\n📅 ${inspectionInfo}\n\n${pestConcerns}\n\n📋 Check: Top and bottom of leaves, stems, soil around base\n📸 Take photos of any issues for identification`,
        category: 'pest_control',
        priority: 'medium',
        dueDate: today,
        source: 'system_generated'
      });
    }

    // 4. HARVEST PREPARATION - Enhanced with activity tracking
    const harvestDate = crop.harvestDate ? new Date(crop.harvestDate) : null;
    if (harvestDate) {
      const daysToHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));
      if (daysToHarvest <= 7 && daysToHarvest > 0) {
        const lastHarvestPrep = recentActivities.find(a =>
          a.title.toLowerCase().includes('harvest') ||
          a.title.toLowerCase().includes('tool') ||
          a.title.toLowerCase().includes('prepare')
        );

        const prepInfo = lastHarvestPrep ?
          `Previous prep: ${lastHarvestPrep.date.toLocaleDateString()}` :
          'No harvest preparation recorded';

        tasks.push({
          crop: crop._id,
          user: crop.user,
          title: `🚨 Prepare for ${cropName} harvest`,
          description: `🌾 HARVEST PREPARATION\n\n⏰ Harvest scheduled in ${daysToHarvest} days\n📅 ${prepInfo}\n\n✅ Tasks:\n• Check crop maturity indicators\n• Clean and sharpen harvesting tools\n• Prepare storage containers\n• Check weather forecast\n• Plan harvesting schedule\n\n💡 Early morning harvest often gives best quality.`,
          category: 'harvesting',
          priority: 'high',
          dueDate: today,
          source: 'system_generated',
          generationFactors: {
            weather: { daysToHarvest }
          }
        });
      }
    }

    // 5. SMART WEEDING - Based on maintenance history
    const lastWeeding = getLastActivityOfType('maintenance') ||
      recentActivities.find(a => a.title.toLowerCase().includes('weed'));
    const daysSinceWeeding = lastWeeding ?
      Math.floor((today - lastWeeding.date) / (1000 * 60 * 60 * 24)) : 999;

    if ((cropAge > 0 && cropAge % 14 === 0) || daysSinceWeeding > 14) {
      const weedingInfo = lastWeeding ?
        `Last weeding: ${lastWeeding.date.toLocaleDateString()} (${daysSinceWeeding} days ago)` :
        'No recent weeding activity recorded';

      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Remove weeds around ${cropName}`,
        description: `🌿 WEED MANAGEMENT\n\n📅 ${weedingInfo}\n\n🎯 Why: Weeds compete for nutrients, water, and sunlight\n\n📋 Method:\n• Hand-pull small weeds when soil is moist\n• Use hoe for larger areas\n• Mulch after weeding to prevent regrowth\n\n⏰ Best time: After watering or rain when soil is soft`,
        category: 'soil_management',
        priority: 'medium',
        dueDate: today,
        source: 'system_generated',
        generationFactors: {
          weather: { daysSinceWeeding }
        }
      });
    }
  }

  // 6. SOIL PREPARATION FOR PLANNING CROPS - Enhanced with detailed instructions
  if (crop.status === 'Planning') {
    const lastSoilPrep = getLastActivityOfType('maintenance') ||
      recentActivities.find(a => a.title.toLowerCase().includes('soil') ||
        a.title.toLowerCase().includes('till'));

    const prepInfo = lastSoilPrep ?
      `Previous soil work: ${lastSoilPrep.date.toLocaleDateString()}` :
      'No recent soil preparation recorded';

    // Get soil-specific advice based on crop type
    let soilAdvice = '';
    if (cropName.toLowerCase().includes('tomato') || cropName.toLowerCase().includes('pepper')) {
      soilAdvice = '🎯 Target: Well-draining, pH 6.0-6.8, rich in organic matter';
    } else if (cropName.toLowerCase().includes('rice')) {
      soilAdvice = '🎯 Target: Clay-loam soil, can hold water, pH 6.0-7.0';
    } else if (cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('wheat')) {
      soilAdvice = '🎯 Target: Deep, fertile soil with good drainage, pH 6.0-7.0';
    } else {
      soilAdvice = '🎯 Target: Well-draining soil rich in organic matter';
    }

    tasks.push({
      crop: crop._id,
      user: crop.user,
      title: `Prepare field for ${cropName}`,
      description: `🚜 FIELD PREPARATION\n\n📅 ${prepInfo}\n\n${soilAdvice}\n\n📋 Steps:\n• Clear weeds and debris\n• Till soil 6-8 inches deep\n• Add compost or aged manure\n• Level the field\n• Test soil pH if possible\n\n💡 Let soil settle for 1-2 weeks before planting`,
      category: 'soil_management',
      priority: 'medium',
      dueDate: today,
      source: 'system_generated',
      generationFactors: {
        cropStage: 'Planning phase'
      }
    });
  }

  // Limit to realistic number of daily tasks per crop (max 2-3 tasks)
  return tasks.slice(0, 3);
}

/**
 * @route   POST /api/tasks/:id/complete
 * @desc    Mark a daily task as completed and create activity record
 * @access  Private
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const { notes, images } = req.body; // Optional completion details

    // Find and update the task
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId, status: 'pending', generationType: 'individual_task' },
      {
        status: 'done',
        completedDate: new Date(),
        ...(notes && { 'feedback.notes': notes }),
        ...(images && { 'feedback.images': images })
      },
      { new: true }
    ).populate('crop', 'name variety status');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or already completed'
      });
    }

    // Create corresponding activity record for learning
    try {
      let activityType = 'general';

      // Map task categories to activity types
      switch (task.category) {
        case 'irrigation':
          activityType = 'watering';
          break;
        case 'pest_control':
          activityType = 'inspection';
          break;
        case 'soil_management':
          activityType = 'maintenance';
          break;
        case 'fertilization':
          activityType = 'fertilization';
          break;
        case 'harvesting':
          activityType = 'harvesting';
          break;
        default:
          activityType = 'general';
      }

      // Create activity record
      const activity = new Activity({
        crop: task.crop._id,
        user: userId,
        title: `Completed: ${task.title}`,
        description: `✅ Task completed via AgriTech system\n\nOriginal task: ${task.description}${notes ? `\n\nUser notes: ${notes}` : ''}`,
        activityType: activityType,
        date: new Date(),
        tags: ['system-generated', 'task-completion', task.category]
      });

      await activity.save();

      console.log(`📝 Created activity record for task completion: ${task.title}`);
    } catch (activityError) {
      // Don't fail the task completion if activity creation fails
      console.error('Error creating activity record:', activityError);
    }

    // Update the daily generation tracker record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Task.updateOne(
      {
        user: userId,
        generationType: 'daily_generation_tracker',
        'dailyGeneration.date': today
      },
      { $inc: { 'dailyGeneration.completedTasks': 1 } }
    );

    res.json({
      success: true,
      task,
      message: `✅ Task completed: ${task.title}`,
      activityCreated: true
    });

  } catch (error) {
    console.error('Error completing daily task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});/**
 * @route   GET /api/tasks/today
 * @desc    Get today's tasks for the authenticated user
 * @access  Private
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      dueDate: { $gte: today, $lt: tomorrow },
      status: 'pending'
    };

    // Filter by crop if provided
    if (req.query.cropId) {
      query.crop = req.query.cropId;
    }

    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ priority: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/upcoming
 * @desc    Get upcoming tasks (next 7 days) for the authenticated user
 * @access  Private
 */
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      dueDate: { $gt: today, $lte: nextWeek },
      status: 'pending'
    };

    // Filter by crop if provided
    if (req.query.cropId) {
      query.crop = req.query.cropId;
    }

    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ dueDate: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/history
 * @desc    Get task history (completed or skipped tasks)
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const {
      cropId,
      category,
      startDate,
      endDate,
      status = ['done', 'skipped'],
      limit = 30,
      skip = 0
    } = req.query;

    // Build query
    const query = {
      user: req.user._id,
      generationType: 'individual_task', // Only individual tasks
      status: Array.isArray(status) ? { $in: status } : status
    };

    // Filter by crop if provided
    if (cropId) {
      query.crop = cropId;
    }

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Filter by completion date range if provided
    if (startDate || endDate) {
      query.completedDate = {};
      if (startDate) {
        query.completedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.completedDate.$lte = new Date(endDate);
      }
    }

    // Fetch task history with pagination
    const tasks = await Task.find(query)
      .populate('crop', 'name variety status')
      .sort({ completedDate: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/crop/:cropId
 * @desc    Get all tasks for a specific crop
 * @access  Private
 */
router.get('/crop/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    const { status, category, limit = 50, skip = 0 } = req.query;

    // Verify crop exists and belongs to the user
    const crop = await Crop.findOne({ _id: cropId, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // Build query
    const query = {
      crop: cropId,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    };

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by category if provided
    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    // Fetch tasks with pagination
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error(`Error fetching tasks for crop ${req.params.cropId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    }).populate('crop', 'name variety status');

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      crop: cropId,
      title,
      description,
      priority,
      category,
      dueDate,
      recommendedTimeframe,
      source,
      generationFactors,
      resources
    } = req.body;

    // Verify crop exists and belongs to the user
    const crop = await Crop.findOne({ _id: cropId, user: req.user._id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    const task = new Task({
      crop: cropId,
      user: req.user._id,
      title,
      description,
      priority,
      category,
      dueDate,
      recommendedTimeframe,
      source,
      generationFactors,
      resources
    });

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status (mark as done or skipped)
 * @access  Private
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, feedback } = req.body;

    if (!['pending', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update status
    task.status = status;

    // If the task is being marked as done or skipped, record the completion date
    if (status === 'done' || status === 'skipped') {
      task.completedDate = new Date();

      // Record feedback if provided
      if (feedback) {
        task.feedback = {
          ...task.feedback,
          ...feedback
        };
      }
    } else {
      // If reverting to pending, clear completion date
      task.completedDate = null;
    }

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error updating task status for ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Private
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update status to done
    task.status = 'done';
    task.completedDate = new Date();

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error marking task as complete for ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      dueDate,
      recommendedTimeframe,
      resources,
      feedback
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Update allowed fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;
    if (recommendedTimeframe) task.recommendedTimeframe = recommendedTimeframe;
    if (resources) task.resources = resources;
    if (feedback) task.feedback = { ...task.feedback, ...feedback };

    await task.save();

    // Populate the crop reference in the response
    await task.populate('crop', 'name variety status');

    res.json(task);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      generationType: 'individual_task' // Only individual tasks
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tasks/generate-recommendations
 * @desc    Generate task recommendations for all user crops or a specific crop
 * @access  Private
 */
router.post('/generate-recommendations', async (req, res) => {
  try {
    const { cropId, includeWeather = true, includeGrowthStage = true, includeDisease = true } = req.body;

    // Get weather data - in a real implementation, you would fetch from a weather API
    // based on the user's location or crop locations
    const weatherData = {
      temp: 25, // Example temperature in °C
      daily: [
        {
          time: new Date().toISOString(),
          values: {
            temperatureMax: 28,
            temperatureMin: 18,
            precipitation: 0,
            precipitationProbability: 10
          }
        },
        {
          time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          values: {
            temperatureMax: 27,
            temperatureMin: 17,
            precipitation: 5,
            precipitationProbability: 80
          }
        }
      ]
    };

    // Disease risks - in a real implementation, this could come from disease detection system
    const diseaseRisks = {
      // Example disease risk
      'Powdery Mildew': { level: 'medium', confidence: 0.7 }
    };

    let result;

    if (cropId) {
      // Generate recommendations for a specific crop
      const crop = await Crop.findOne({ _id: cropId, user: req.user._id });

      if (!crop) {
        return res.status(404).json({ message: 'Crop not found or access denied' });
      }

      const recommendations = await generateRecommendations(
        crop,
        weatherData,
        diseaseRisks,
        {
          includeWeatherTasks: includeWeather,
          includeGrowthStageTasks: includeGrowthStage,
          includeDiseaseTasks: includeDisease
        }
      );

      const savedTasks = await saveRecommendations(recommendations);

      result = {
        success: true,
        taskCount: savedTasks.length,
        tasks: savedTasks
      };
    } else {
      // Generate recommendations for all user's crops
      result = await generateAllUserTaskRecommendations(
        req.user._id,
        {
          weatherData,
          diseaseRisks,
          includeWeatherTasks: includeWeather,
          includeGrowthStageTasks: includeGrowthStage,
          includeDiseaseTasks: includeDisease
        }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Error generating task recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;