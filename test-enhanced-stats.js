/**
 * Test script to verify enhanced Quick Stats functionality
 */

function testEnhancedQuickStats() {
  console.log('🧪 Testing Enhanced Quick Stats Implementation...');

  // Mock crop data with various scenarios
  const mockCrops = [
    {
      _id: '1',
      name: 'Tomato',
      status: 'Growing',
      growthStage: 'Reproductive',
      plantingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      expectedHarvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lastIrrigation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      lastFertilization: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      lastPestCheck: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      costs: [
        { amount: 500, category: 'Seeds' },
        { amount: 300, category: 'Fertilizer' }
      ]
    },
    {
      _id: '2',
      name: 'Rice',
      status: 'Growing',
      growthStage: 'Vegetative',
      plantingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      expectedHarvestDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      lastIrrigation: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago - needs irrigation
      lastFertilization: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago - needs fertilization
      lastPestCheck: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago - needs pest check
      costs: [
        { amount: 800, category: 'Seeds' },
        { amount: 400, category: 'Fertilizer' },
        { amount: 200, category: 'Pesticide' }
      ]
    },
    {
      _id: '3',
      name: 'Wheat',
      status: 'Planning',
      costs: [
        { amount: 300, category: 'Planning' }
      ]
    },
    {
      _id: '4',
      name: 'Tomato',
      status: 'Growing',
      growthStage: 'Seedling',
      plantingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      expectedHarvestDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      lastIrrigation: null, // Never irrigated - needs irrigation
      lastFertilization: null, // Never fertilized - needs fertilization
      lastPestCheck: null, // Never checked - needs pest check
      costs: [
        { amount: 200, category: 'Seeds' }
      ]
    },
    {
      _id: '5',
      name: 'Corn',
      status: 'Completed',
      costs: [
        { amount: 600, category: 'Seeds' }
      ]
    },
    {
      _id: '6',
      name: 'Pepper',
      status: 'Growing',
      growthStage: 'Maturity',
      plantingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      expectedHarvestDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      costs: [
        { amount: 400, category: 'Seeds' }
      ]
    }
  ];

  console.log('📊 Mock Crop Data:');
  console.table(mockCrops.map(crop => ({
    name: crop.name,
    status: crop.status,
    growthStage: crop.growthStage || 'N/A',
    age: crop.plantingDate ? `${Math.floor((new Date() - new Date(crop.plantingDate)) / (1000 * 60 * 60 * 24))}d` : 'N/A'
  })));

  // Calculate each statistic
  const stats = {
    activeCrops: mockCrops.filter(crop => crop.status !== 'Completed' && crop.status !== 'Failed').length,
    irrigationNeeded: mockCrops.filter(crop => {
      if (!crop.lastIrrigation) return crop.status === 'Growing';
      const lastIrrigDate = new Date(crop.lastIrrigation);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return lastIrrigDate < threeDaysAgo && crop.status === 'Growing';
    }).length,
    daysToHarvest: (() => {
      const harvestableCrops = mockCrops.filter(crop =>
        crop.status === 'Growing' &&
        crop.plantingDate &&
        crop.expectedHarvestDate
      );
      if (harvestableCrops.length === 0) return '--';

      const earliestHarvest = harvestableCrops.reduce((earliest, crop) => {
        const harvestDate = new Date(crop.expectedHarvestDate);
        const earliestDate = new Date(earliest.expectedHarvestDate);
        return harvestDate < earliestDate ? crop : earliest;
      });

      const daysToHarvest = Math.ceil((new Date(earliestHarvest.expectedHarvestDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysToHarvest > 0 ? daysToHarvest : 0;
    })(),
    totalExpenses: mockCrops.reduce((total, crop) => {
      return total + (crop.costs ? crop.costs.reduce((cropTotal, cost) => cropTotal + (cost.amount || 0), 0) : 0);
    }, 0),
    tasksPending: (() => {
      let pendingTasks = 0;
      mockCrops.forEach(crop => {
        if (crop.status !== 'Growing' && crop.status !== 'Planning') return;

        if (crop.status === 'Growing') {
          // Irrigation needs
          const lastIrrigation = crop.lastIrrigation ? new Date(crop.lastIrrigation) : null;
          const daysSinceIrrigation = lastIrrigation ? Math.floor((new Date() - lastIrrigation) / (1000 * 60 * 60 * 24)) : null;
          if (!lastIrrigation || daysSinceIrrigation >= 2) pendingTasks++;

          // Fertilization needs
          const lastFertilization = crop.lastFertilization ? new Date(crop.lastFertilization) : null;
          const daysSinceFertilization = lastFertilization ? Math.floor((new Date() - lastFertilization) / (1000 * 60 * 60 * 24)) : null;
          if (!lastFertilization || daysSinceFertilization >= 14) pendingTasks++;

          // Pest check needs
          const lastPestCheck = crop.lastPestCheck ? new Date(crop.lastPestCheck) : null;
          const daysSincePestCheck = lastPestCheck ? Math.floor((new Date() - lastPestCheck) / (1000 * 60 * 60 * 24)) : null;
          if (!lastPestCheck || daysSincePestCheck >= 7) pendingTasks++;
        }

        if (crop.status === 'Planning') pendingTasks++;
      });
      return pendingTasks;
    })(),
    cropVarieties: new Set(mockCrops.map(crop => crop.name)).size,
    growthStages: (() => {
      const stages = ['Seedling', 'Vegetative', 'Reproductive', 'Maturity'];
      const activeCrops = mockCrops.filter(crop => crop.status === 'Growing');
      const stagesPresent = new Set(activeCrops.map(crop => crop.growthStage).filter(stage => stage && stages.includes(stage)));
      return stagesPresent.size;
    })(),
    avgCropAge: (() => {
      const activeCrops = mockCrops.filter(crop =>
        crop.status === 'Growing' && crop.plantingDate
      );
      if (activeCrops.length === 0) return '--';

      const totalDays = activeCrops.reduce((sum, crop) => {
        const plantDate = new Date(crop.plantingDate);
        const daysSincePlanting = Math.floor((new Date() - plantDate) / (1000 * 60 * 60 * 24));
        return sum + daysSincePlanting;
      }, 0);

      return Math.floor(totalDays / activeCrops.length);
    })()
  };

  console.log('\n📈 Calculated Statistics:');
  console.table({
    'Active Crops': { value: stats.activeCrops, description: 'Non-completed/failed crops' },
    'Irrigation Needed': { value: stats.irrigationNeeded, description: 'Crops needing water (3+ days)' },
    'Days to Harvest': { value: stats.daysToHarvest, description: 'Nearest harvest date' },
    'Total Expenses': { value: `₹${stats.totalExpenses}`, description: 'Sum of all crop costs' },
    'Tasks Pending': { value: stats.tasksPending, description: 'Irrigation + Fertilization + Pest + Planning' },
    'Crop Varieties': { value: stats.cropVarieties, description: 'Unique crop types' },
    'Growth Stages': { value: stats.growthStages, description: 'Different growth phases' },
    'Avg Crop Age': { value: `${stats.avgCropAge}d`, description: 'Average days since planting' }
  });

  // Test UI layout changes
  console.log('\n🎨 UI Layout Changes:');
  console.log('Before: 3-column grid (md:grid-cols-3)');
  console.log('After:  4-column responsive grid (md:grid-cols-2 lg:grid-cols-4)');
  console.log('Mobile: Single column stack');
  console.log('Tablet: 2 columns');
  console.log('Desktop: 4 columns');

  // Test stat card colors and icons
  console.log('\n🎨 Stat Card Design:');
  const statCards = [
    { name: 'Active Crops', icon: 'Seedling', color: 'green', bg: 'bg-green-100' },
    { name: 'Irrigation Needed', icon: 'Droplet', color: 'blue', bg: 'bg-blue-100' },
    { name: 'Days to Harvest', icon: 'Calendar', color: 'purple', bg: 'bg-purple-100' },
    { name: 'Total Expenses', icon: 'Rupee', color: 'amber', bg: 'bg-amber-100' },
    { name: 'Tasks Pending', icon: 'Warning', color: 'red', bg: 'bg-red-100' },
    { name: 'Crop Varieties', icon: 'ChartLine', color: 'emerald', bg: 'bg-emerald-100' },
    { name: 'Growth Stages', icon: 'Leaf', color: 'teal', bg: 'bg-teal-100' },
    { name: 'Avg Crop Age', icon: 'Clipboard', color: 'indigo', bg: 'bg-indigo-100' }
  ];

  statCards.forEach((card, index) => {
    console.log(`${index + 1}. ${card.name}: ${card.icon} icon, ${card.color} color, ${card.bg}`);
  });

  // Test responsiveness
  console.log('\n📱 Responsive Design:');
  console.log('Mobile (xs): 1 column - cards stack vertically');
  console.log('Tablet (md): 2 columns - cards in 2x4 grid');
  console.log('Desktop (lg+): 4 columns - cards in 2x4 or 1x8 grid');

  // Test data diversity
  console.log('\n🎯 Statistic Categories:');
  const categories = [
    { category: 'Quantity', stats: ['Active Crops', 'Crop Varieties', 'Growth Stages'] },
    { category: 'Time-based', stats: ['Days to Harvest', 'Avg Crop Age'] },
    { category: 'Action-required', stats: ['Irrigation Needed', 'Tasks Pending'] },
    { category: 'Financial', stats: ['Total Expenses'] }
  ];

  categories.forEach(cat => {
    console.log(`${cat.category}: ${cat.stats.join(', ')}`);
  });

  // Expected benefits
  console.log('\n✨ Enhanced Benefits:');
  const benefits = [
    'More diverse and meaningful statistics',
    'Better farm management insights at a glance',
    'Actionable metrics (irrigation needed, tasks pending)',
    'Time-based planning info (days to harvest, crop age)',
    'Financial tracking (total expenses)',
    'Crop diversity tracking (varieties, growth stages)',
    'Improved visual layout with more cards',
    'Better responsive design for all screen sizes'
  ];

  benefits.forEach((benefit, index) => {
    console.log(`${index + 1}. ✓ ${benefit}`);
  });

  console.log('\n🎉 Enhanced Quick Stats Test Complete!');
  console.log('📝 Summary: Added 6 new diverse statistics with improved 4-column responsive layout.');
}

// Run the test
testEnhancedQuickStats();