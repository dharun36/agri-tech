// CommonJS syntax
const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const en = require('./locales/en/translation.json');
const ta = require('./locales/ta/translation.json');
const hi = require('./locales/hi/translation.json');

// Initialize i18n for the script
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

// Simple inspection function
function inspectTranslations() {
  const result = {
    languages: ['en', 'ta', 'hi'],
    missingKeysInTamil: [],
    missingKeysInHindi: []
  };

  // Find keys in English but missing in Tamil
  Object.keys(flattenObject(en)).forEach(key => {
    if (!getNestedValue(ta, key.split('.'))) {
      result.missingKeysInTamil.push(key);
    }
  });

  // Find keys in English but missing in Hindi
  Object.keys(flattenObject(en)).forEach(key => {
    if (!getNestedValue(hi, key.split('.'))) {
      result.missingKeysInHindi.push(key);
    }
  });

  return result;
}

// Helper function to flatten an object
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

// Helper function to get nested value
function getNestedValue(obj, path) {
  return path.reduce((prev, curr) => {
    return prev && prev[curr] ? prev[curr] : undefined;
  }, obj);
}

// Run the inspector and log the results
const results = inspectTranslations();
console.log("Missing Keys in Tamil:", results.missingKeysInTamil);
console.log("Missing Keys in Hindi:", results.missingKeysInHindi);