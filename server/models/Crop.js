const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'Growing' }
});

module.exports = mongoose.model('Crop', cropSchema); 