import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation resources
import en from './locales/en/translation.json'
import ta from './locales/ta/translation.json'
import hi from './locales/hi/translation.json'

// Import task-specific translations
import taskEn from './locales/en/tasks.json'
import taskTa from './locales/ta/tasks.json'
import taskHi from './locales/hi/tasks.json'

// Log translation status for debugging

// // Check for any empty translation files
// if (!en || Object.keys(en).length === 0) {
//   console.error('English translation file is empty or not loaded correctly');
// }

// if (!ta || Object.keys(ta).length === 0) {
//   console.error('Tamil translation file is empty or not loaded correctly');
// }

// if (!hi || Object.keys(hi).length === 0) {
//   console.error('Hindi translation file is empty or not loaded correctly');
// }

// Prepare resources object
const resources = {
  en: {
    translation: en,
    tasks: taskEn
  },
  ta: {
    translation: ta,
    tasks: taskTa
  },
  hi: {
    translation: hi,
    tasks: taskHi
  }
}

// Check if database_content paths exist in each language
const validateDatabaseContent = (lang, resources) => {
  const res = resources[lang]?.translation;
  if (!res) return false;

  // Check for database_content structure
  if (!res.database_content) {
    // console.error(`Missing database_content structure in ${lang} translations`);
    return false;
  }

  // Check for crops
  if (!res.database_content.crops || Object.keys(res.database_content.crops).length === 0) {
    // console.error(`Missing or empty crops in ${lang} database_content`);
    return false;
  }

  return true;
};

// Validate key paths
Object.keys(resources).forEach(lang => {
  validateDatabaseContent(lang, resources);
});

// Get user's preferred language or default to English
const storedLang = localStorage.getItem('i18nextLng') || 'en';

// Initialize i18next
// Force reload: 2025-11-21
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    debug: true, // Enable debug for troubleshooting
    keySeparator: '.',
    nsSeparator: ':',
    returnEmptyString: false,
    react: {
      useSuspense: false
    }
  })
  .then(() => {
    // i18n initialized successfully
    console.log('i18n initialized with language:', i18n.language);
    console.log('Available resources:', Object.keys(resources));
    console.log('Test translation - tasks.today_tasks:', i18n.t('tasks.today_tasks'));
    console.log('Test translation - tasks.daily_activities:', i18n.t('tasks.daily_activities'));
    console.log('Test translation - tasks.done:', i18n.t('tasks.done'));
    console.log('Test translation - tasks.skip:', i18n.t('tasks.skip'));
  })
  .catch(error => {
    console.error('i18n initialization error:', error);
  });

// Set document language attribute for screen readers
document.documentElement.lang = i18n.language;

// Make i18n available on window for debugging
if (typeof window !== 'undefined') {
  window.i18next = i18n;
}

export default i18n
