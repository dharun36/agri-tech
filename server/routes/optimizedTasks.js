/**
 * Optimized routes for task-related API endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');
const { generateTaskRecommendations } = require('../utils/optimizedTaskRecommendationGenerator');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Extract query parameters
    const { cropId, category, status, startDate, endDate } = req.query;

    // Build query filter
    const filter = { userId: req.user.id };

    // Add optional filters if provided
    if (cropId) filter.cropId = cropId;
    if (category) filter.category = category;
    if (status) filter.status = status;

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    // Get tasks with sorting and projection to improve performance
    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .select('-__v')
      .lean()
      .exec();

    res.json({ tasks });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/today
 * @desc    Get tasks due today for the authenticated user
 * @access  Private
 */
router.get('/today', auth, async (req, res) => {
  try {
    const { cropId, category } = req.query;

    // Calculate today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Build query filter
    const filter = {
      userId: req.user.id,
      dueDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'pending'
    };

    if (cropId) filter.cropId = cropId;
    if (category) filter.category = category;

    // Use lean() for better performance on read operations
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean()
      .exec();

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching today tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/upcoming
 * @desc    Get upcoming tasks for the authenticated user
 * @access  Private
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { cropId, category, days = 7 } = req.query;

    // Calculate date range
    const today = new Date();
    const startOfTomorrow = new Date(today);
    startOfTomorrow.setDate(today.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + parseInt(days));
    endDate.setHours(23, 59, 59, 999);

    // Build query filter
    const filter = {
      userId: req.user.id,
      dueDate: {
        $gte: startOfTomorrow,
        $lte: endDate
      },
      status: 'pending'
    };

    if (cropId) filter.cropId = cropId;
    if (category) filter.category = category;

    // Use lean() for better performance
    const tasks = await Task.find(filter)
      .sort({ dueDate: 1 })
      .select('-__v')
      .lean()
      .exec();

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching upcoming tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/history
 * @desc    Get completed/skipped tasks for the authenticated user
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { cropId, category, limit = 30 } = req.query;

    // Build query filter
    const filter = {
      userId: req.user.id,
      status: { $in: ['done', 'skipped'] }
    };

    if (cropId) filter.cropId = cropId;
    if (category) filter.category = category;

    // Use pagination to improve performance
    const tasks = await Task.find(filter)
      .sort({ completedDate: -1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean()
      .exec();

    res.json({ tasks, count: tasks.length });
  } catch (err) {
    console.error('Error fetching task history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a specific task by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id)
      .select('-__v')
      .lean()
      .exec();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, dueDate, cropId, notes, imageUrl } = req.body;

    // Validate required fields
    if (!title || !description || !category || !dueDate || !cropId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate cropId
    if (!mongoose.Types.ObjectId.isValid(cropId)) {
      return res.status(400).json({ message: 'Invalid crop ID' });
    }

    // Check if crop exists and belongs to user
    const crop = await Crop.findOne({ _id: cropId, userId: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or not owned by user' });
    }

    // Create new task
    const newTask = new Task({
      title,
      description,
      category,
      dueDate,
      cropId,
      userId: req.user.id,
      notes,
      imageUrl
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Extract fields to update
    const { title, description, category, dueDate, notes, imageUrl } = req.body;

    // Update only provided fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;
    if (notes !== undefined) task.notes = notes;
    if (imageUrl !== undefined) task.imageUrl = imageUrl;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status
 * @access  Private
 */
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update status
    const { status } = req.body;
    if (!status || !['pending', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    task.status = status;

    // Update completedDate if task is done or skipped
    if (status === 'done' || status === 'skipped') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tasks/recommendations/:cropId
 * @desc    Get AI-generated task recommendations for a crop
 * @access  Private
 */
router.get('/recommendations/:cropId', auth, async (req, res) => {
  try {
    const { cropId } = req.params;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(cropId)) {
      return res.status(400).json({ message: 'Invalid crop ID' });
    }

    // Check if crop exists and belongs to user
    const crop = await Crop.findOne({ _id: cropId, userId: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or not owned by user' });
    }

    // Check if the user has already requested this within the last minute (rate limiting)
    const userRequestKey = `${req.user.id}:${cropId}`;
    const userLastRequestTime = userRequestTimes.get(userRequestKey);
    if (userLastRequestTime && (Date.now() - userLastRequestTime) < 60000) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please try again in a minute.',
        retryAfter: 60 - Math.floor((Date.now() - userLastRequestTime) / 1000)
      });
    }
    userRequestTimes.set(userRequestKey, Date.now());

    // Generate recommendations using the optimized function that includes caching
    const recommendations = await generateAIRecommendations(crop, req.user);

    res.json({ recommendations });
  } catch (err) {
    console.error('Error generating task recommendations:', err);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

// Track user request times for rate limiting
const userRequestTimes = new Map();

module.exports = router;