const mongoose = require('mongoose');
const CropPrice = require('./models/CropPrice');

const checkPrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech');
    
    const count = await CropPrice.countDocuments();
    console.log('📊 Total price records in DB:', count);
    
    if (count > 0) {
      console.log('\n📋 Recent 15 records:');
      const samples = await CropPrice.find().sort({date: -1}).limit(15);
      samples.forEach(s => {
        console.log(`  ${s.crop_name.padEnd(15)} - ₹${(s.price/100).toFixed(2).padEnd(8)} - ${s.city.padEnd(20)} - ${s.date.toLocaleDateString()}`);
      });
      
      // Check for specific crops
      console.log('\n🔍 Checking specific crops:');
      const crops = ['potato', 'sugarcane', 'paddy', 'groundnut'];
      for (const crop of crops) {
        const found = await CropPrice.findOne({ crop_name: crop }).sort({ date: -1 });
        if (found) {
          console.log(`  ✅ ${crop}: ₹${(found.price/100).toFixed(2)} - ${found.city} (${found.date.toLocaleDateString()})`);
        } else {
          console.log(`  ❌ ${crop}: No data found`);
        }
      }
    } else {
      console.log('❌ Database is empty - no cached prices available');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkPrices();
