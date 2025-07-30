const express = require('express');
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes below require auth
router.use(auth);

// Get all crops for user
router.get('/', async (req, res) => {
  const crops = await Crop.find({ user: req.user._id });
  res.json(crops);
});

// Add crop
router.post('/', async (req, res) => {
  const { name, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const crop = await Crop.create({ user: req.user._id, name, status });
  res.json(crop);
});

// Update crop
router.put('/:id', async (req, res) => {
  const crop = await Crop.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  if (!crop) return res.status(404).json({ message: 'Crop not found' });
  res.json(crop);
});

// Delete crop
router.delete('/:id', async (req, res) => {
  const crop = await Crop.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!crop) return res.status(404).json({ message: 'Crop not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router; 