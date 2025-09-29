// Test script to check if the market_prices key is accessible in all languages
import i18n from './i18n';

// Initialize i18n (this is already done when the app starts)
// Check the key in all languages
const languages = ['en', 'ta', 'hi'];
languages.forEach(lang => {
  const currentLang = i18n.language;
  i18n.changeLanguage(lang);

  const key = 'page_titles.market_prices';
  const translation = i18n.t(key);
  const exists = i18n.exists(key);
  // Restore original language
  i18n.changeLanguage(currentLang);
});

// Test the PageTitle component specifically
const key = 'page_titles.market_prices';
const exists = i18n.exists(key);
console.log(`Translation: ${i18n.t(key)}`);