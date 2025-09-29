import fs from 'fs';

// Keys to check in the English translation file
const keysToCheck = [
  'drag_and_drop',
  'welcome_to_agritech',
  'loading_weather',
  'track_and_manage',
  'no_crops_added',
  'quick_stats',
  'total_crops',
  'growing_crops',
  'total_expenses',
  'active_crops',
  'search_crops',
  'all_status',
  'completed',
  'newest_first',
  'oldest_first',
  'advanced_filters',
  'planted',
  'days_growing',
  'days',
  'expenses',
  'suggested_action',
  'add_expense',
  'more_actions',
  'page_titles.market_prices'
];

// Helper function to check if a nested key exists in an object
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

// Read English translation file
try {
  const enTranslations = JSON.parse(fs.readFileSync('./src/locales/en/translation.json', 'utf8'));

  console.log('Checking English translations for keys:');
  console.log('-----------------------------------');

  for (const key of keysToCheck) {
    const value = getNestedValue(enTranslations, key);
    if (value !== undefined) {
      console.log(`✅ ${key}: ${value}`);
    } else {
      console.log(`❌ ${key}: Missing`);
    }
  }

  console.log('\nTranslation check complete!');
} catch (error) {
  console.error('Error reading translation file:', error);
}