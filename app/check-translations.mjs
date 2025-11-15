// Check specific translations in Tamil
import fs from 'fs';

// Read Tamil translation file
const taTranslations = JSON.parse(fs.readFileSync('./src/locales/ta/translation.json', 'utf8'));

// List of keys we need to check
const keysToCheck = [
  'welcome_to_agritech',
  'loading_weather',
  'track_and_manage',
  'no_crops_added',
  'quick_stats',
  'total_crops',
  'growing_crops',
  'total_expenses',
  'active_crops',
  'humidity',
  'search_crops',
  'all_status',
  'completed',
  'newest_first',
  'oldest_first',
  'advanced_filters',
  'planning',
  'growing',
  'harvested',
  'failed',
  'add_crop',
  'check_location_settings',
  'no_crops_match_filters',
  'view_details'
];

// console.log('Checking Tamil translations for keys:');
// console.log('-----------------------------------');

// Deep get function to safely access nested properties
const deepGet = (obj, path) => {
  const parts = path.split('.');
  return parts.reduce((acc, part) => acc && acc[part] ? acc[part] : undefined, obj);
};

// Check if each key exists
keysToCheck.forEach(key => {
  // Try direct key access
  const value = taTranslations[key];

  if (value) {
    // console.log(`✅ ${key}: ${value}`);
  } else {
    // Try nested key access for cases like "tasks.completed"
    const nestedValue = deepGet(taTranslations, key);

    if (nestedValue) {
      // console.log(`✅ ${key}: ${nestedValue} (nested)`);
    } else {
      // console.log(`❌ ${key}: MISSING`);
    }
  }
});

// console.log('\nTranslation check complete!');