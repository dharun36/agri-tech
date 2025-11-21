const mongoose = require('mongoose');
const CropPrice = require('./models/CropPrice');

const seedPrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech');
    console.log('🔗 Connected to MongoDB');

    // Sample historical price data (prices in paise - multiply by 100)
    const samplePrices = [
      // Potato
      { crop_name: 'potato', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 2500, date: new Date('2025-11-15') },
      { crop_name: 'potato', city: 'Erode', state: 'Tamil Nadu', market: 'Erode Market', price: 2600, date: new Date('2025-11-10') },
      { crop_name: 'potato', city: 'Coimbatore', state: 'Tamil Nadu', market: 'Coimbatore Market', price: 2400, date: new Date('2025-11-18') },

      // Sugarcane
      { crop_name: 'sugarcane', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 3500, date: new Date('2025-11-12') },
      { crop_name: 'sugarcane', city: 'Erode', state: 'Tamil Nadu', market: 'Erode Market', price: 3400, date: new Date('2025-11-15') },
      { crop_name: 'sugarcane', city: 'Salem', state: 'Tamil Nadu', market: 'Salem Market', price: 3600, date: new Date('2025-11-17') },

      // Paddy (Rice)
      { crop_name: 'paddy', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 2200, date: new Date('2025-11-14') },
      { crop_name: 'paddy', city: 'Thanjavur', state: 'Tamil Nadu', market: 'Thanjavur Market', price: 2300, date: new Date('2025-11-16') },
      { crop_name: 'paddy', city: 'Trichy', state: 'Tamil Nadu', market: 'Trichy Market', price: 2250, date: new Date('2025-11-18') },

      // Groundnut
      { crop_name: 'groundnut', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 6500, date: new Date('2025-11-13') },
      { crop_name: 'groundnut', city: 'Erode', state: 'Tamil Nadu', market: 'Erode Market', price: 6400, date: new Date('2025-11-16') },
      { crop_name: 'groundnut', city: 'Coimbatore', state: 'Tamil Nadu', market: 'Coimbatore Market', price: 6600, date: new Date('2025-11-19') },

      // Maize
      { crop_name: 'maize', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 2000, date: new Date('2025-11-17') },
      { crop_name: 'maize', city: 'Erode', state: 'Tamil Nadu', market: 'Erode Market', price: 1950, date: new Date('2025-11-19') },

      // Tomato
      { crop_name: 'tomato', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 3200, date: new Date('2025-11-20') },
      { crop_name: 'tomato', city: 'Coimbatore', state: 'Tamil Nadu', market: 'Coimbatore Market', price: 3100, date: new Date('2025-11-19') },

      // Onion
      { crop_name: 'onion', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 2800, date: new Date('2025-11-18') },
      { crop_name: 'onion', city: 'Erode', state: 'Tamil Nadu', market: 'Erode Market', price: 2900, date: new Date('2025-11-20') },

      // Cotton
      { crop_name: 'cotton', city: 'Karur', state: 'Tamil Nadu', market: 'Karur Market', price: 5500, date: new Date('2025-11-15') },
      { crop_name: 'cotton', city: 'Coimbatore', state: 'Tamil Nadu', market: 'Coimbatore Market', price: 5600, date: new Date('2025-11-18') },
    ];

    console.log(`📝 Inserting ${samplePrices.length} sample price records...`);

    // Clear existing data first (optional)
    await CropPrice.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert sample data
    await CropPrice.insertMany(samplePrices);
    console.log('✅ Successfully seeded price data!');

    // Verify
    const count = await CropPrice.countDocuments();
    console.log(`\n📊 Total records now: ${count}`);

    // Show sample
    console.log('\n📋 Sample records:');
    const samples = await CropPrice.find().sort({ date: -1 }).limit(10);
    samples.forEach(s => {
      console.log(`  ${s.crop_name.padEnd(15)} - ₹${(s.price / 100).toFixed(2).padEnd(8)} - ${s.city.padEnd(20)} - ${s.date.toLocaleDateString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedPrices();
