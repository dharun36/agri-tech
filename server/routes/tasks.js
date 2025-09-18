const express = require('express');
const Task = require('../models/Task');
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