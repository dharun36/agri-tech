const express = require('express');
const mongoose = require('mongoose');
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
      beneficialPlants, notes, initialCost
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

    // Handle flattened location structure
    if (location) {
      if (location.name) cropData.locationName = location.name;
      if (location.coordinates) {
        if (location.coordinates.latitude) cropData.locationLatitude = location.coordinates.latitude;
        if (location.coordinates.longitude) cropData.locationLongitude = location.coordinates.longitude;
      }
      if (location.area) cropData.locationArea = Number(location.area);
      if (location.areaUnit) cropData.locationAreaUnit = location.areaUnit;
    }

    if (soilType) cropData.soilType = soilType;
    if (previousCrop) cropData.previousCrop = previousCrop;
    if (companionCrops) cropData.companionCrops = companionCrops;
    if (trapCrops) cropData.trapCrops = trapCrops;
    if (beneficialPlants) cropData.beneficialPlants = beneficialPlants;

    // Add initial note if provided
    if (notes) {
      cropData.notes = [{ date: new Date(), text: notes }];
    }

    // Add initial cost if provided
    if (initialCost && initialCost.amount > 0) {
      cropData.costs = [{
        date: new Date(),
        category: initialCost.category || 'seeds',
        amount: parseFloat(initialCost.amount),
        description: initialCost.description || `Initial ${initialCost.category || 'seed'} cost`
      }];
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

// Add expense to crop
router.post('/:id/costs', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { description, category, amount } = req.body;

    if (!description || !category || amount === undefined) {
      return res.status(400).json({ message: 'Description, category and amount are required' });
    }

    const newExpense = {
      date: new Date(),
      category,
      amount: parseFloat(amount),
      description
    };

    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $push: { costs: newExpense } },
      { new: true }
    );

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json(crop);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add irrigation event
router.post('/:id/irrigation', async (req, res) => {
  try {
    console.log('Irrigation endpoint hit with params:', req.params);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID from auth middleware:', req.user?._id);

    // Validate user ID
    if (!req.user || !req.user._id) {
      console.error('Missing or invalid user ID in auth middleware');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate crop ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid crop ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid crop ID format' });
    }

    // Find the crop with explicit user ID check
    const crop = await Crop.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean(); // Use lean() to get a plain JS object without Mongoose document methods

    console.log('Crop found:', crop ? 'Yes' : 'No', crop ? `(Name: ${crop.name})` : '');

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    const {
      date, duration, amount, method,
      waterSource, soilMoistureBefore, soilMoistureAfter, notes
    } = req.body;

    // Input validation
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Type safety
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Create the irrigation event with proper type conversion
    const irrigationEvent = {
      date: parsedDate,
      duration: duration !== undefined && duration !== '' ? Number(duration) : undefined,
      amount: amount !== undefined && amount !== '' ? Number(amount) : undefined,
      method: method || undefined,
      waterSource: waterSource || undefined,
      soilMoistureBefore: soilMoistureBefore !== undefined && soilMoistureBefore !== '' ?
        Number(soilMoistureBefore) : undefined,
      soilMoistureAfter: soilMoistureAfter !== undefined && soilMoistureAfter !== '' ?
        Number(soilMoistureAfter) : undefined,
      notes: notes || undefined
    };

    console.log('Processed irrigation event:', JSON.stringify(irrigationEvent, null, 2));

    // Create or update directly with Mongoose without validation issues
    const result = await Crop.findByIdAndUpdate(
      req.params.id,
      { $push: { irrigationHistory: irrigationEvent } },
      { new: true, runValidators: false }
    );

    if (!result) {
      return res.status(404).json({ message: 'Could not update crop' });
    }

    console.log('Crop updated successfully with new irrigation event');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error adding irrigation event:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      message: 'Server error processing irrigation event',
      error: error.message,
      type: error.name
    });
  }
});

// Update irrigation event
router.put('/:id/irrigation/:eventId', async (req, res) => {
  try {
    console.log('Update irrigation endpoint hit with params:', req.params);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!req.user || !req.user._id) {
      console.error('Missing or invalid user ID in auth middleware');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid crop ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid crop ID format' });
    }

    if (!req.params.eventId || !mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      console.error('Invalid event ID:', req.params.eventId);
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Process and validate numeric fields
    const updateData = {};
    if (req.body.date) {
      const parsedDate = new Date(req.body.date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      updateData['irrigationHistory.$.date'] = parsedDate;
    }

    const numericFields = ['duration', 'amount', 'soilMoistureBefore', 'soilMoistureAfter'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        const numValue = Number(req.body[field]);
        if (isNaN(numValue)) {
          return res.status(400).json({ message: `Invalid numeric value for ${field}` });
        }
        updateData[`irrigationHistory.$.${field}`] = numValue;
      }
    });

    // String fields
    const stringFields = ['method', 'waterSource', 'notes'];
    stringFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[`irrigationHistory.$.${field}`] = req.body[field];
      }
    });

    // Use direct MongoDB update to avoid validation issues
    const result = await Crop.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        'irrigationHistory._id': req.params.eventId
      },
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!result) {
      return res.status(404).json({ message: 'Crop or irrigation event not found' });
    }

    console.log('Irrigation event updated successfully');
    res.json(result);
  } catch (error) {
    console.error('Error updating irrigation event:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error updating irrigation event',
      error: error.message
    });
  }
});

// Delete irrigation event
router.delete('/:id/irrigation/:eventId', async (req, res) => {
  try {
    console.log('Delete irrigation endpoint hit with params:', req.params);

    if (!req.user || !req.user._id) {
      console.error('Missing or invalid user ID in auth middleware');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid crop ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid crop ID format' });
    }

    if (!req.params.eventId || !mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      console.error('Invalid event ID:', req.params.eventId);
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Use direct MongoDB update to avoid validation issues
    const result = await Crop.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { $pull: { irrigationHistory: { _id: req.params.eventId } } },
      { new: true, runValidators: false }
    );

    if (!result) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    console.log('Irrigation event deleted successfully');
    res.json(result);
  } catch (error) {
    console.error('Error deleting irrigation event:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error deleting irrigation event',
      error: error.message
    });
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