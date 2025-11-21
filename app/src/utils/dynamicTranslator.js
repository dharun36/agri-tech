// Translation utility for AI-generated task content

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Translate a single task using backend translation service
 */
export async function translateTaskContent(task, targetLocale, sourceLocale = 'en') {
  if (!task || targetLocale === 'en') return task;
  
  try {
    const response = await fetch(`${API_BASE}/api/translate/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        task,
        sourceLocale,
        targetLocale
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.translated || task;
    }
  } catch (error) {
    console.error('Translation error:', error);
  }
  
  // Fallback: return original task
  return task;
}

/**
 * Translate a batch of tasks
 */
export async function translateTasksBatch(tasks, targetLocale, sourceLocale = 'en') {
  if (!Array.isArray(tasks) || tasks.length === 0 || targetLocale === 'en') {
    return tasks;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/translate/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        tasks,
        sourceLocale,
        targetLocale
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.translated || tasks;
    }
  } catch (error) {
    console.error('Batch translation error:', error);
  }
  
  // Fallback: return original tasks
  return tasks;
}
