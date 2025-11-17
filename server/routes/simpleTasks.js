const express = require('express');
const router = express.Router();

// Simple in-memory storage for demo purposes
let tasks = [
  {
    id: '1',
    title: 'Water tomato plants',
    description: 'Check soil moisture and water if needed',
    category: 'irrigation',
    priority: 'high',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'irrigation'
  },
  {
    id: '2',
    title: 'Apply fertilizer to corn',
    description: 'Apply nitrogen-rich fertilizer to growing corn',
    category: 'fertilizer',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    type: 'fertilizer'
  },
  {
    id: '3',
    title: 'Inspect for pests',
    description: 'Check plants for signs of pest damage',
    category: 'pest_control',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    type: 'pesticide'
  }
];

// GET /api/tasks - Get all tasks
router.get('/', (req, res) => {
  try {
    const { status, category, dueAfter, dueBefore, limit = 50 } = req.query;

    let filteredTasks = [...tasks];

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    if (category) {
      filteredTasks = filteredTasks.filter(task => task.category === category);
    }

    if (dueAfter) {
      filteredTasks = filteredTasks.filter(task => task.dueDate >= dueAfter);
    }

    if (dueBefore) {
      filteredTasks = filteredTasks.filter(task => task.dueDate <= dueBefore);
    }

    // Limit results
    filteredTasks = filteredTasks.slice(0, parseInt(limit));

    res.json({
      tasks: filteredTasks,
      total: filteredTasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', (req, res) => {
  try {
    const task = tasks.find(t => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req, res) => {
  try {
    const { title, description, category, priority, dueDate, type } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description: description || '',
      category: category || 'general',
      priority: priority || 'medium',
      status: 'pending',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      type: type || 'general',
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!['pending', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    tasks[taskIndex].status = status;

    if (status === 'done' || status === 'skipped') {
      tasks[taskIndex].completedDate = new Date().toISOString();
    }

    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:id/done - Mark task as done (legacy endpoint)
router.post('/:id/done', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    tasks[taskIndex].status = 'done';
    tasks[taskIndex].completedDate = new Date().toISOString();

    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error('Error marking task as done:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;