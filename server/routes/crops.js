const express = require('express');
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require auth
router.use(auth);

// Get all crops for user (with optional filtering)
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Build query based on filter parameters
    const query = { user: req.user._id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by field ID if provided
    if (req.query.fieldId) {
      query.fieldId = req.query.fieldId;
    }

    // Filter by planting date range if provided
    if (req.query.plantedAfter || req.query.plantedBefore) {
      query.plantingDate = {};
      if (req.query.plantedAfter) {
        query.plantingDate.$gte = new Date(req.query.plantedAfter);
      }
      if (req.query.plantedBefore) {
        query.plantingDate.$lte = new Date(req.query.plantedBefore);
      }
    }

    const crops = await Crop.find(query);
    res.json(crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single crop by ID with all details
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json(crop);
  } catch (error) {
    console.error('Error fetching crop details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new crop with enhanced details
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      name, status, variety, plantingDate, harvestDate,
      seedSource, plantingMethod, fieldId, location,
      soilType, previousCrop, companionCrops, trapCrops,
      beneficialPlants, notes
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Name required' });

    const cropData = {
      user: req.user._id,
      name,
      status: status || 'Growing'
    };

    // Add optional fields if provided
    if (variety) cropData.variety = variety;
    if (plantingDate) cropData.plantingDate = new Date(plantingDate);
    if (harvestDate) cropData.harvestDate = new Date(harvestDate);
    if (seedSource) cropData.seedSource = seedSource;
    if (plantingMethod) cropData.plantingMethod = plantingMethod;
    if (fieldId) cropData.fieldId = fieldId;
    if (location) cropData.location = location;
    if (soilType) cropData.soilType = soilType;
    if (previousCrop) cropData.previousCrop = previousCrop;
    if (companionCrops) cropData.companionCrops = companionCrops;
    if (trapCrops) cropData.trapCrops = trapCrops;
    if (beneficialPlants) cropData.beneficialPlants = beneficialPlants;

    // Add initial note if provided
    if (notes) {
      cropData.notes = [{ date: new Date(), text: notes }];
    }

    const crop = await Crop.create(cropData);
    res.json(crop);
  } catch (error) {
    console.error('Error creating crop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update basic crop information
router.put('/:id', async (req, res) => {
  try {
    // Remove event history arrays from direct updates
    // These should be modified via their specific endpoints
    const {
      irrigationHistory, fertilizationHistory, pestDiseaseHistory,
      growthHistory, harvestHistory, weatherEvents, costs, laborHours,
      notes, ...updateData
    } = req.body;

    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json(crop);
  } catch (error) {
    console.error('Error updating crop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete crop
router.delete('/:id', async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting crop:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Event-specific endpoints ===

// Add irrigation event
router.post('/:id/irrigation', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const {
      date, duration, amount, method,
      waterSource, soilMoistureBefore, soilMoistureAfter, notes
    } = req.body;

    if (!date) return res.status(400).json({ message: 'Date required' });

    crop.irrigationHistory.push({
      date: new Date(date),
      duration,
      amount,
      method,
      waterSource,
      soilMoistureBefore,
      soilMoistureAfter,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding irrigation event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update irrigation event
router.put('/:id/irrigation/:eventId', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const irrigationEvent = crop.irrigationHistory.id(req.params.eventId);
    if (!irrigationEvent) return res.status(404).json({ message: 'Irrigation event not found' });

    Object.assign(irrigationEvent, req.body);
    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error updating irrigation event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete irrigation event
router.delete('/:id/irrigation/:eventId', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    crop.irrigationHistory.id(req.params.eventId).remove();
    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error deleting irrigation event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add fertilization event
router.post('/:id/fertilization', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const {
      date, type, product, npkRatio, amount,
      applicationMethod, coverage, notes
    } = req.body;

    if (!date || !type) return res.status(400).json({ message: 'Date and type required' });

    crop.fertilizationHistory.push({
      date: new Date(date),
      type,
      product,
      npkRatio,
      amount,
      applicationMethod,
      coverage,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding fertilization event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update fertilization event
router.put('/:id/fertilization/:eventId', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const fertilizationEvent = crop.fertilizationHistory.id(req.params.eventId);
    if (!fertilizationEvent) return res.status(404).json({ message: 'Fertilization event not found' });

    Object.assign(fertilizationEvent, req.body);
    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error updating fertilization event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete fertilization event
router.delete('/:id/fertilization/:eventId', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    crop.fertilizationHistory.id(req.params.eventId).remove();
    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error deleting fertilization event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add pest/disease event
router.post('/:id/pest-disease', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const {
      date, type, name, severity, affectedArea,
      treatment, effectiveness, notes
    } = req.body;

    if (!date || !type) return res.status(400).json({ message: 'Date and type required' });

    crop.pestDiseaseHistory.push({
      date: new Date(date),
      type,
      name,
      severity,
      affectedArea,
      treatment,
      effectiveness,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding pest/disease event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add growth record
router.post('/:id/growth', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const {
      date, stage, height, canopyWidth,
      images, healthRating, notes
    } = req.body;

    if (!date) return res.status(400).json({ message: 'Date required' });

    crop.growthHistory.push({
      date: new Date(date),
      stage,
      height,
      canopyWidth,
      images,
      healthRating,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding growth record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add harvest record
router.post('/:id/harvest', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const {
      date, yield, yieldUnit, quality,
      marketValue, notes
    } = req.body;

    if (!date) return res.status(400).json({ message: 'Date required' });

    crop.harvestHistory.push({
      date: new Date(date),
      yield,
      yieldUnit,
      quality,
      marketValue,
      notes
    });

    // Update crop status to harvested if this is the first harvest
    if (crop.harvestHistory.length === 1) {
      crop.status = 'Harvested';
      crop.actualHarvestDate = new Date(date);
    }

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding harvest record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add note to crop
router.post('/:id/notes', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Note text required' });

    crop.notes.push({
      date: new Date(),
      text
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add cost entry
router.post('/:id/costs', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const { date, category, amount, description } = req.body;

    if (!date || !amount || !category) {
      return res.status(400).json({ message: 'Date, amount, and category required' });
    }

    crop.costs.push({
      date: new Date(date),
      category,
      amount,
      description
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding cost entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add labor hours entry
router.post('/:id/labor', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const { date, hours, task, personnel, notes } = req.body;

    if (!date || !hours || !task) {
      return res.status(400).json({ message: 'Date, hours, and task required' });
    }

    crop.laborHours.push({
      date: new Date(date),
      hours,
      task,
      personnel,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding labor entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add weather event
router.post('/:id/weather', async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });

    const { date, eventType, severity, impact, notes } = req.body;

    if (!date || !eventType) {
      return res.status(400).json({ message: 'Date and event type required' });
    }

    crop.weatherEvents.push({
      date: new Date(date),
      eventType,
      severity,
      impact,
      notes
    });

    await crop.save();
    res.json(crop);
  } catch (error) {
    console.error('Error adding weather event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;