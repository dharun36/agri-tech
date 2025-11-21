/**
 * Translation service for AI-generated content
 * Uses Google Translate API or fallback to mock translations
 */

// Common agricultural terms translations
const commonTranslations = {
  ta: {
    // Task categories
    'IRRIGATION': 'நீர்ப்பாசனம்',
    'FERTILIZATION': 'உரமிடல்',
    'PEST_CONTROL': 'பூச்சி கட்டுப்பாடு',
    'DISEASE_TREATMENT': 'நோய் சிகிச்சை',
    'HARVESTING': 'அறுவடை',
    'PLANTING': 'நடவு',
    'PRUNING': 'கிளை வெட்டுதல்',
    'SOIL_MANAGEMENT': 'மண் நிர்வாகம்',
    'WEATHER_RESPONSE': 'வானிலை பதிலளிப்பு',
    'GENERAL': 'பொது',
    'WEED_MANAGEMENT': 'களை மேலாண்மை',
    'Water your': 'உங்கள் {crop} க்கு நீர் பாய்ச்சவும்',
    'Apply fertilizer to': '{crop} க்கு உரம் இடவும்',
    'Check for pests on': '{crop} இல் பூச்சிகளை சரிபார்க்கவும்',
    'Remove weeds around': '{crop} சுற்றி களைகளை நீக்கவும்',
    'Monitor growth of': '{crop} வளர்ச்சியை கண்காணிக்கவும்',
    'Harvest': '{crop} அறுவடை செய்யவும்',
    'Prune': '{crop} கிளைகளை வெட்டவும்',
    'Inspect': '{crop} ஐ ஆய்வு செய்யவும்',

    // Time periods
    'today': 'இன்று',
    'tomorrow': 'நாளை',
    'this week': 'இந்த வாரம்',
    'next week': 'அடுத்த வாரம்',
    'overdue': 'தாமதமானது',

    // Priority
    'URGENT': 'அவசர',
    'HIGH': 'உயர்',
    'MEDIUM': 'நடுத்தர',
    'LOW': 'குறைந்த',

    // Status
    'IRRIGATION_NEEDED': 'நீர்ப்பாசனம் தேவை',
    'FERTILIZATION_DUE': 'உரமிடல் நேரம்',
    'PEST_DETECTED': 'பூச்சிகள் கண்டறியப்பட்டன',
    'READY_TO_HARVEST': 'அறுவடைக்கு தயார்'
  },
  hi: {
    // Task categories
    'IRRIGATION': 'सिंचाई',
    'FERTILIZATION': 'उर्वरक',
    'PEST_CONTROL': 'कीट नियंत्रण',
    'DISEASE_TREATMENT': 'रोग उपचार',
    'HARVESTING': 'कटाई',
    'PLANTING': 'रोपण',
    'PRUNING': 'छंटाई',
    'SOIL_MANAGEMENT': 'मिट्टी प्रबंधन',
    'WEATHER_RESPONSE': 'मौसम प्रतिक्रिया',
    'GENERAL': 'सामान्य',
    'WEED_MANAGEMENT': 'खरपतवार प्रबंधन',

    // Common phrases
    'Water your': 'अपनी {crop} को पानी दें',
    'Apply fertilizer to': '{crop} में उर्वरक डालें',
    'Check for pests on': '{crop} पर कीटों की जांच करें',
    'Remove weeds around': '{crop} के आसपास खरपतवार हटाएं',
    'Monitor growth of': '{crop} की वृद्धि की निगरानी करें',
    'Harvest': '{crop} की कटाई करें',
    'Prune': '{crop} की छंटाई करें',
    'Inspect': '{crop} का निरीक्षण करें'
  }
};

// Crop name translations
const cropTranslations = {
  ta: {
    'Rice': 'அரிசி',
    'Wheat': 'கோதுமை',
    'Corn': 'சோளம்',
    'Cotton': 'பருத்தி',
    'Sugarcane': 'கரும்பு',
    'Potato': 'உருளைக்கிழங்கு',
    'Tomato': 'தக்காளி',
    'Onion': 'வெங்காயம்',
    'Chilli': 'மிளகாய்',
    'Soybean': 'சோயாபீன்',
    'Groundnut': 'வேர்க்கடலை',
    'Maize': 'மக்காச்சோளம்',
    'Paddy': 'நெல்'
  },
  hi: {
    'Rice': 'चावल',
    'Wheat': 'गेहूं',
    'Corn': 'मक्का',
    'Cotton': 'कपास',
    'Sugarcane': 'गन्ना',
    'Potato': 'आलू',
    'Tomato': 'टमाटर',
    'Onion': 'प्याज',
    'Chilli': 'मिर्च',
    'Soybean': 'सोयाबीन',
    'Groundnut': 'मूंगफली',
    'Maize': 'मक्का',
    'Paddy': 'धान'
  }
};

/**
 * Translate a task description using pattern matching
 */
function translateTaskDescription(description, cropName, targetLocale) {
  if (!description || targetLocale === 'en') return description;

  const translations = commonTranslations[targetLocale];
  const crops = cropTranslations[targetLocale];

  if (!translations) return description;

  // Translate crop name
  const translatedCrop = crops[cropName] || cropName;

  // Try to find matching pattern
  for (const [pattern, translation] of Object.entries(translations)) {
    if (description.includes(pattern) || description.toLowerCase().includes(pattern.toLowerCase())) {
      return translation.replace('{crop}', translatedCrop);
    }
  }

  // Fallback: translate known words
  let translated = description;

  // Replace crop name
  if (cropName && crops[cropName]) {
    translated = translated.replace(new RegExp(cropName, 'gi'), crops[cropName]);
  }

  // Replace common words
  Object.entries(translations).forEach(([en, local]) => {
    if (!en.includes('{crop}')) {
      translated = translated.replace(new RegExp(en, 'gi'), local);
    }
  });

  return translated;
}

/**
 * Translate task object
 */
function translateTask(task, targetLocale = 'en') {
  if (!task || targetLocale === 'en') return task;

  const translated = { ...task };

  // Preserve crop name in English (never translate crop names)
  if (task.crop?.name) {
    translated.cropName = task.crop.name;
  } else if (task.cropName) {
    translated.cropName = task.cropName;
  }

  // Translate description
  if (task.description) {
    const cropName = task.crop?.name || task.cropName;
    translated.description = translateTaskDescription(task.description, cropName, targetLocale);
  }

  // Translate category
  if (task.category && commonTranslations[targetLocale]?.[task.category]) {
    translated.categoryTranslated = commonTranslations[targetLocale][task.category];
  }

  // Translate priority
  if (task.priority && commonTranslations[targetLocale]?.[task.priority]) {
    translated.priorityTranslated = commonTranslations[targetLocale][task.priority];
  }

  return translated;
}

/**
 * Translate batch of tasks
 */
function translateTasks(tasks, targetLocale = 'en') {
  if (!Array.isArray(tasks) || targetLocale === 'en') return tasks;

  return tasks.map(task => translateTask(task, targetLocale));
}

/**
 * Main translation function for arbitrary objects
 * @param {object} content - Arbitrary object with string values
 * @param {string} sourceLocale - e.g., 'en'
 * @param {string} targetLocale - e.g., 'ta', 'hi'
 */
async function translateObject(content, sourceLocale = 'en', targetLocale = 'ta') {
  if (targetLocale === 'en' || targetLocale === sourceLocale) {
    return { translated: content, engine: 'none' };
  }

  // If content is a task or array of tasks, use task translation
  if (Array.isArray(content)) {
    return { translated: translateTasks(content, targetLocale), engine: 'pattern-matching' };
  } else if (content.description || content.category) {
    return { translated: translateTask(content, targetLocale), engine: 'pattern-matching' };
  }

  // For other objects, return as-is (can be extended with API integration)
  return { translated: content, engine: 'mock' };
}

module.exports = {
  translateObject,
  translateTask,
  translateTasks,
  translateTaskDescription
};
