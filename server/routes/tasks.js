const express = require('express');
const Task = require('../models/Task');
const DailyTaskGeneration = require('../models/DailyTaskGeneration');
const Crop = require('../models/Crop');
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
    const query = { user: req.user._id };

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
    const todaysGeneration = await DailyTaskGeneration.getTodaysGeneration(userId);
    
    if (todaysGeneration && todaysGeneration.status === 'completed') {
      // Tasks already generated today, return existing tasks
      const tasks = await Task.find({
        _id: { $in: todaysGeneration.taskIds },
        status: 'pending' // Only return pending tasks
      }).populate('crop', 'name variety status').sort({ priority: -1 });

      return res.json({
        success: true,
        tasks,
        generated: false,
        generatedAt: todaysGeneration.createdAt,
        totalGenerated: todaysGeneration.tasksGenerated,
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

    // Create generation record
    const dailyGeneration = new DailyTaskGeneration({
      user: userId,
      date: today,
      tasksGenerated: tasks.length,
      taskIds,
      cropsProcessed,
      totalTasks: tasks.length,
      status: 'completed'
    });

    await dailyGeneration.save();

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
 */
async function generateDailyTasksForCrop(crop, today, dayOfWeek) {
  const tasks = [];
  const cropName = crop.name || crop.cropName;

  // 1. Irrigation Tasks - Check every 2-3 days based on real farming needs
  if (crop.status === 'Growing') {
    const lastWatered = crop.lastIrrigation ? new Date(crop.lastIrrigation) : null;
    const daysSinceWater = lastWatered
      ? Math.floor((today - lastWatered) / (1000 * 60 * 60 * 24))
      : 5; // Assume needs water if no record

    // Different crops have different water needs
    let waterInterval = 2; // Default 2 days
    if (cropName.toLowerCase().includes('rice') || cropName.toLowerCase().includes('paddy')) {
      waterInterval = 1; // Rice needs daily water
    } else if (cropName.toLowerCase().includes('wheat') || cropName.toLowerCase().includes('corn')) {
      waterInterval = 3; // Grains can go 3 days
    }

    if (daysSinceWater >= waterInterval) {
      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Water ${cropName}`,
        description: lastWatered
          ? `Last watered ${daysSinceWater} days ago. Check soil moisture level first.`
          : 'Check soil moisture and water thoroughly if dry.',
        category: 'irrigation',
        priority: daysSinceWater > waterInterval + 2 ? 'high' : 'medium',
        dueDate: today,
        source: 'system_generated'
      });
    }

    // 2. Fertilizer Tasks - Based on realistic crop growth cycles
    const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : null;
    const cropAge = plantingDate ? Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24)) : 0;

    // Apply fertilizer at key growth stages
    if (cropAge === 21 || cropAge === 45 || cropAge === 70) { // 3 weeks, 6 weeks, 10 weeks
      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Apply fertilizer to ${cropName}`,
        description: `Apply balanced NPK fertilizer (10:10:10). Crop is ${cropAge} days old.`,
        category: 'fertilization',
        priority: 'medium',
        dueDate: today,
        source: 'system_generated'
      });
    }

    // 3. Weekly Pest Inspection - Monday is inspection day
    if (dayOfWeek === 1) { // Monday
      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Weekly pest inspection - ${cropName}`,
        description: 'Check leaves (top and bottom), stems, and around the base for pests or diseases.',
        category: 'pest_control',
        priority: 'low',
        dueDate: today,
        source: 'system_generated'
      });
    }

    // 4. Harvest preparation - when getting close to harvest
    const harvestDate = crop.harvestDate ? new Date(crop.harvestDate) : null;
    if (harvestDate) {
      const daysToHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24));
      if (daysToHarvest <= 7 && daysToHarvest > 0) {
        tasks.push({
          crop: crop._id,
          user: crop.user,
          title: `Prepare for ${cropName} harvest`,
          description: `Harvest in ${daysToHarvest} days. Check crop maturity and prepare harvesting tools.`,
          category: 'harvesting',
          priority: 'high',
          dueDate: today,
          source: 'system_generated'
        });
      }
    }

    // 5. Weeding - Every 2 weeks
    if (cropAge > 0 && cropAge % 14 === 0) {
      tasks.push({
        crop: crop._id,
        user: crop.user,
        title: `Remove weeds around ${cropName}`,
        description: 'Remove weeds that compete with your crop for nutrients and water.',
        category: 'soil_management',
        priority: 'medium',
        dueDate: today,
        source: 'system_generated'
      });
    }
  }

  // 6. Soil preparation for planning crops
  if (crop.status === 'Planning') {
    tasks.push({
      crop: crop._id,
      user: crop.user,
      title: `Prepare field for ${cropName}`,
      description: 'Clear weeds, till soil 6-8 inches deep, and add compost or organic matter.',
      category: 'soil_management',
      priority: 'medium',
      dueDate: today,
      source: 'system_generated'
    });
  }

  // Limit to realistic number of daily tasks per crop
  return tasks.slice(0, 3); // Max 3 tasks per crop per day
}

/**
 * @route   POST /api/tasks/:id/complete
 * @desc    Mark a daily task as completed
 * @access  Private
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;

    // Find and update the task
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId, status: 'pending' },
      { 
        status: 'done',
        completedDate: new Date()
      },
      { new: true }
    ).populate('crop', 'name variety status');

    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found or already completed' 
      });
    }

    // Update the daily generation record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailyTaskGeneration.updateOne(
      { user: userId, date: today },
      { $inc: { completedTasks: 1 } }
    );

    res.json({
      success: true,
      task,
      message: `Task completed: ${task.title}`
    });

  } catch (error) {
    console.error('Error completing daily task:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
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
    const query = { crop: cropId, user: req.user._id };

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
      user: req.user._id
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
      user: req.user._id
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
      user: req.user._id
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
      user: req.user._id
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
      user: req.user._id
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