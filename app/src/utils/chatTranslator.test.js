/**
 * Test file for chat translator
 * Run this to test the translation functionality
 */

import { translateToTamil, translateFromTamil, translateResponse, getSuggestedMessages } from './chatTranslator.js';

console.log('🧪 Testing Chat Translator...\n');

// Test 1: English to Tamil
console.log('Test 1: English to Tamil');
const englishText = 'Hello! I want to add tomatoes to my farm. What is the price today?';
const tamilTranslated = translateToTamil(englishText);
console.log('Input (EN):', englishText);
console.log('Output (TA):', tamilTranslated);
console.log('');

// Test 2: Tamil to English
console.log('Test 2: Tamil to English');
const tamilText = 'வணக்கம்! என் பண்ணையில் தக்காளி சேர்க்க விரும்புகிறேன். இன்று விலை என்ன?';
const englishTranslated = translateFromTamil(tamilText);
console.log('Input (TA):', tamilText);
console.log('Output (EN):', englishTranslated);
console.log('');

// Test 3: Response translation
console.log('Test 3: Auto-translate based on language');
const response1 = 'Successfully added tomatoes to your farm. You should water them today.';
const translatedToTamil = translateResponse(response1, 'ta');
console.log('Input (EN):', response1);
console.log('Output for Tamil user:', translatedToTamil);
console.log('');

// Test 4: Suggested messages
console.log('Test 4: Suggested Messages');
console.log('English suggestions:', getSuggestedMessages('en'));
console.log('Tamil suggestions:', getSuggestedMessages('ta'));
console.log('');

// Test 5: Complex farming response
console.log('Test 5: Complex farming response');
const complexResponse = `Great! I have added tomatoes to your farm. Here are some tasks for today:
- Watering: Water your tomato plants
- Fertilization: Apply fertilizer to wheat
- Check pest control for onions`;

const complexTamil = translateToTamil(complexResponse);
console.log('Input (EN):', complexResponse);
console.log('Output (TA):', complexTamil);

console.log('\n✅ Translation tests completed!');
