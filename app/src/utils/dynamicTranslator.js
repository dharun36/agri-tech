// Client-side helper to translate dynamic content via backend Lingo.dev SDK
// Falls back gracefully if server has no API key configured

export async function translateTaskContent(task, targetLocale, sourceLocale = 'en') {
  try {
    if (!task || !targetLocale || targetLocale === sourceLocale) return task

    const content = {
      title: task.title || '',
      description: task.description || '',
    }

    const resp = await fetch('http://localhost:5000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sourceLocale, targetLocale }),
    })

    if (!resp.ok) return task
    const data = await resp.json()
    if (!data?.success || !data?.translated) return task

    return {
      ...task,
      displayTitle: data.translated.title || task.title,
      displayDescription: data.translated.description || task.description,
    }
  } catch (e) {
    return task
  }
}

export async function translateTasksBatch(tasks, targetLocale, sourceLocale = 'en') {
  if (!Array.isArray(tasks) || tasks.length === 0) return tasks
  const promises = tasks.map(t => translateTaskContent(t, targetLocale, sourceLocale))
  const results = await Promise.all(promises)
  return results
}
