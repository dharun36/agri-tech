const express = require('express')
const router = express.Router()
const { translateObject } = require('../services/translationService')

// POST /api/translate
// body: { content: object, sourceLocale?: 'en', targetLocale: 'ta' }
router.post('/', async (req, res) => {
  try {
    const { content, sourceLocale = 'en', targetLocale } = req.body || {}
    if (!content || !targetLocale) {
      return res.status(400).json({ success: false, message: 'content and targetLocale are required' })
    }
    const result = await translateObject(content, sourceLocale, targetLocale)
    return res.json({ success: true, ...result })
  } catch (err) {
    console.error('translate route error:', err)
    return res.status(500).json({ success: false, message: 'Translation failed', error: err.message })
  }
})

module.exports = router
