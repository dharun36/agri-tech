const express = require('express');
const auth = require('../middleware/auth');
const { translateTask, translateTasks } = require('../services/translationService');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * Translate a single task
 * POST /api/translate/task
 */
router.post('/task', async (req, res) => {
  try {
    const { task, sourceLocale = 'en', targetLocale } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task object is required' });
    }
    
    if (!targetLocale) {
      return res.status(400).json({ error: 'Target locale is required' });
    }
    
    const translated = translateTask(task, targetLocale);
    
    res.json({ 
      translated,
      sourceLocale,
      targetLocale,
      engine: 'pattern-matching'
    });
  } catch (error) {
    console.error('Task translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

/**
 * Translate multiple tasks
 * POST /api/translate/tasks
 */
router.post('/tasks', async (req, res) => {
  try {
    const { tasks, sourceLocale = 'en', targetLocale } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    if (!targetLocale) {
      return res.status(400).json({ error: 'Target locale is required' });
    }
    
    const translated = translateTasks(tasks, targetLocale);
    
    res.json({ 
      translated,
      sourceLocale,
      targetLocale,
      count: translated.length,
      engine: 'pattern-matching'
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
