// ES Module syntax
import fs from 'fs';
import path from 'path';

// Read translation files
const readJsonFile = (filepath) => {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filepath}:`, error);
    return null;
  }
};

const en = readJsonFile('src/locales/en/translation.json');
const ta = readJsonFile('src/locales/ta/translation.json');
const hi = readJsonFile('src/locales/hi/translation.json');

// Simple inspection function
function inspectTranslations() {
  const result = {
    languages: ['en', 'ta', 'hi'],
    missingKeysInTamil: [],
    missingKeysInHindi: []
  };

  // Find keys in English but missing in Tamil
  if (en && ta) {
    Object.keys(flattenObject(en)).forEach(key => {
      if (!getNestedValue(ta, key.split('.'))) {
        result.missingKeysInTamil.push(key);
      }
    });
  }

  // Find keys in English but missing in Hindi
  if (en && hi) {
    Object.keys(flattenObject(en)).forEach(key => {
      if (!getNestedValue(hi, key.split('.'))) {
        result.missingKeysInHindi.push(key);
      }
    });
  }

  return result;
}

// Helper function to flatten an object
function flattenObject(obj, prefix = '') {
  if (!obj) return {};
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
console.log("Missing Keys in Tamil:", results.missingKeysInTamil.length);
console.log("Sample of missing Tamil keys:", results.missingKeysInTamil.slice(0, 10));

console.log("\nMissing Keys in Hindi:", results.missingKeysInHindi.length);
console.log("Sample of missing Hindi keys:", results.missingKeysInHindi.slice(0, 10));