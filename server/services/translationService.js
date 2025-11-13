const { LingoDotDevEngine } = require('lingo.dev/sdk')

let engine = null
function getEngine() {
  if (engine) return engine
  const apiKey = process.env.LINGODOTDEV_API_KEY || process.env.LINGO_API_KEY
  if (!apiKey) return null
  engine = new LingoDotDevEngine({ apiKey })
  return engine
}

/**
 * Translate an object with dynamic text fields using Lingo.dev SDK.
 * Falls back to original if API key is missing or service fails.
 * @param {object} content - Arbitrary object with string values to translate
 * @param {string} sourceLocale - e.g., 'en'
 * @param {string} targetLocale - e.g., 'ta'
 */
async function translateObject(content, sourceLocale = 'en', targetLocale = 'ta') {
  try {
    const eng = getEngine()
    if (!eng) {
      return { translated: content, engine: 'disabled' }
    }

    const translated = await eng.localizeObject(content, {
      sourceLocale,
      targetLocale,
    })
    return { translated, engine: 'lingo.dev' }
  } catch (err) {
    console.error('Translation error:', err.message)
    return { translated: content, engine: 'error', error: err.message }
  }
}

module.exports = { translateObject }
