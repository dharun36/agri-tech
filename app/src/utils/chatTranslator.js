/**
 * Chat Translation Utility
 * Translates chatbot responses between English and Tamil
 */

// English to Tamil translations for common chatbot responses
const translationMap = {
  // Greetings and Common Phrases
  'Hello': 'வணக்கம்',
  'Hi': 'வணக்கம்',
  'Welcome': 'வரவேற்கிறோம்',
  'Thank you': 'நன்றி',
  'Thanks': 'நன்றி',
  'Yes': 'ஆம்',
  'No': 'இல்லை',
  'Good': 'நல்ல',
  'Great': 'சிறந்த',
  'Excellent': 'அருமையான',
  'Please': 'தயவுசெய்து',
  'Sorry': 'மன்னிக்கவும்',
  'Try asking': 'கேட்க முயற்சிக்கவும்',

  // Chatbot specific phrases
  "I'm your farming assistant": 'நான் உங்கள் விவசாய உதவியாளர்',
  'farming assistant': 'விவசாய உதவியாளர்',
  'I can help you': 'நான் உங்களுக்கு உதவ முடியும்',
  'manage crops': 'பயிர்களை நிர்வகிக்க',
  'check weather': 'வானிலையை சரிபார்க்க',
  'track': 'கண்காணிக்க',
  'applications': 'பயன்பாடுகள்',
  'and more': 'மேலும் பல',
  'What would you like to do today': 'இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்',
  'would you like': 'நீங்கள் விரும்புகிறீர்களா',

  // Action Results
  'Added': 'சேர்க்கப்பட்டது',
  'Removed': 'அகற்றப்பட்டது',
  'Created': 'உருவாக்கப்பட்டது',
  'Updated': 'புதுப்பிக்கப்பட்டது',
  'Deleted': 'நீக்கப்பட்டது',
  'Completed': 'முடிந்தது',
  'Success': 'வெற்றி',
  'Successfully': 'வெற்றிகரமாக',
  'Failed': 'தோல்வி',
  'Error': 'பிழை',

  // Farming Terms - Crops
  'crop': 'பயிர்',
  'crops': 'பயிர்கள்',
  'farm': 'பண்ணை',
  'field': 'வயல்',
  'plant': 'செடி',
  'plants': 'செடிகள்',
  'seed': 'விதை',
  'seeds': 'விதைகள்',

  // Specific Crops
  'tomato': 'தக்காளி',
  'tomatoes': 'தக்காளி',
  'potato': 'உருளைக்கிழங்கு',
  'potatoes': 'உருளைக்கிழங்கு',
  'onion': 'வெங்காயம்',
  'onions': 'வெங்காயம்',
  'rice': 'அரிசி',
  'wheat': 'கோதுமை',
  'corn': 'சோளம்',
  'maize': 'மக்காச்சோளம்',
  'sugarcane': 'கரும்பு',
  'cotton': 'பருத்தி',
  'soybean': 'சோயாபீன்',
  'groundnut': 'வேர்க்கடலை',
  'chilli': 'மிளகாய்',
  'chili': 'மிளகாய்',
  'pepper': 'மிளகு',
  'turmeric': 'மஞ்சள்',
  'ginger': 'இஞ்சி',
  'garlic': 'பூண்டு',
  'cabbage': 'முட்டைகோஸ்',
  'carrot': 'கேரட்',
  'beans': 'பீன்ஸ்',
  'peas': 'பட்டாணி',

  // Farming Activities
  'water': 'நீர்',
  'watering': 'நீர் பாய்ச்சுதல்',
  'irrigation': 'நீர்ப்பாசனம்',
  'fertilizer': 'உரம்',
  'fertilization': 'உரமிடல்',
  'harvest': 'அறுவடை',
  'harvesting': 'அறுவடை செய்தல்',
  'planting': 'நடவு',
  'pruning': 'கிளை வெட்டுதல்',
  'weeding': 'களை எடுத்தல்',
  'pest': 'பூச்சி',
  'pests': 'பூச்சிகள்',
  'disease': 'நோய்',
  'diseases': 'நோய்கள்',
  'spray': 'தெளித்தல்',
  'spraying': 'தெளிப்பு',
  'control': 'கட்டுப்பாடு',
  'organic': 'இயற்கை',
  'chemical': 'இரசாயன',

  // Soil and Environment
  'soil': 'மண்',
  'weather': 'வானிலை',
  'rain': 'மழை',
  'sun': 'சூரியன்',
  'temperature': 'வெப்பநிலை',
  'humidity': 'ஈரப்பதம்',
  'wind': 'காற்று',

  // Time
  'today': 'இன்று',
  'tomorrow': 'நாளை',
  'yesterday': 'நேற்று',
  'now': 'இப்போது',
  'later': 'பின்னர்',
  'soon': 'விரைவில்',
  'day': 'நாள்',
  'days': 'நாட்கள்',
  'week': 'வாரம்',
  'weeks': 'வாரங்கள்',
  'month': 'மாதம்',
  'months': 'மாதங்கள்',

  // Tasks
  'task': 'பணி',
  'tasks': 'பணிகள்',
  'work': 'வேலை',
  'activity': 'நடவடிக்கை',
  'activities': 'நடவடிக்கைகள்',

  // Questions
  'What': 'என்ன',
  'When': 'எப்போது',
  'Where': 'எங்கே',
  'Why': 'ஏன்',
  'How': 'எப்படி',
  'Which': 'எது',
  'Who': 'யார்',

  // Common Verbs
  'add': 'சேர்க்க',
  'remove': 'அகற்ற',
  'delete': 'நீக்க',
  'show': 'காட்டு',
  'list': 'பட்டியல்',
  'check': 'சரிபார்க்க',
  'help': 'உதவி',
  'need': 'தேவை',
  'want': 'விரும்பு',
  'can': 'முடியும்',
  'should': 'வேண்டும்',
  'must': 'கண்டிப்பாக',

  // Market & Prices
  'price': 'விலை',
  'prices': 'விலைகள்',
  'market': 'சந்தை',
  'sell': 'விற்க',
  'buy': 'வாங்க',
  'cost': 'செலவு',

  // Numbers (for common phrases)
  'one': 'ஒன்று',
  'two': 'இரண்டு',
  'three': 'மூன்று',
  'four': 'நான்கு',
  'five': 'ஐந்து',

  // Additional helpful phrases
  'farming assistant': 'விவசாய உதவியாளர்',
  'your farm': 'உங்கள் பண்ணை',
  'my farm': 'என் பண்ணை',
  'location': 'இடம்',
  'area': 'பகுதி',
  'available': 'கிடைக்கிறது',
  'not available': 'கிடைக்கவில்லை',
  'ready': 'தயார்',
  'please specify': 'தயவுசெய்து குறிப்பிடவும்',
  'please provide': 'தயவுசெய்து வழங்கவும்',
  'information': 'தகவல்',
  'details': 'விவரங்கள்',
  'notification': 'அறிவிப்பு',
  'alert': 'எச்சரிக்கை',
  'report': 'அறிக்கை',
  'update': 'புதுப்பிப்பு',
  'all': 'அனைத்து',
  'total': 'மொத்தம்',
  'current': 'தற்போதைய',
  'new': 'புதிய',
  'old': 'பழைய'
};

/**
 * Translate text from English to Tamil
 */
export function translateToTamil(text) {
  if (!text || typeof text !== 'string') return text;

  let translatedText = text;

  // Sort by length (longest first) to avoid partial replacements
  const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);

  // Replace each English word/phrase with Tamil equivalent
  sortedEntries.forEach(([english, tamil]) => {
    // Case-insensitive word boundary match
    const regex = new RegExp(`\\b${escapeRegex(english)}\\b`, 'gi');
    translatedText = translatedText.replace(regex, tamil);
  });

  return translatedText;
}

/**
 * Translate text from Tamil to English (for user input)
 */
export function translateFromTamil(text) {
  if (!text || typeof text !== 'string') return text;

  let translatedText = text;

  // Reverse map - Tamil to English
  Object.entries(translationMap).forEach(([english, tamil]) => {
    const regex = new RegExp(escapeRegex(tamil), 'g');
    translatedText = translatedText.replace(regex, english);
  });

  return translatedText;
}

/**
 * Detect if text contains Tamil characters
 */
export function isTamil(text) {
  if (!text) return false;
  // Tamil Unicode range: U+0B80 to U+0BFF
  const tamilRegex = /[\u0B80-\u0BFF]/;
  return tamilRegex.test(text);
}

/**
 * Translate response based on user's language
 */
export function translateResponse(text, userLanguage) {
  if (!text) return text;

  // If user language is Tamil and text is in English, translate
  if (userLanguage === 'ta' && !isTamil(text)) {
    return translateToTamil(text);
  }

  // If user language is English and text is in Tamil, translate
  if (userLanguage === 'en' && isTamil(text)) {
    return translateFromTamil(text);
  }

  return text;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get suggested messages in user's language
 */
export function getSuggestedMessages(language) {
  const suggestions = {
    en: [
      'Show me all my crops',
      'Add tomatoes to my farm',
      "What's the weather like for farming?",
      'I applied fertilizer to my wheat today'
    ],
    ta: [
      'என் அனைத்து பயிர்களையும் காட்டு',
      'என் பண்ணையில் தக்காளி சேர்க்க',
      'விவசாயத்திற்கு வானிலை எப்படி உள்ளது?',
      'இன்று என் கோதுமைக்கு உரம் இட்டேன்'
    ]
  };

  return suggestions[language] || suggestions.en;
}

export default {
  translateToTamil,
  translateFromTamil,
  isTamil,
  translateResponse,
  getSuggestedMessages
};
