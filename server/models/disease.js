const mongoose = require('mongoose');

const disease = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  treatment: { type: String, required: true },
  advice: { type: String, required: true },
  spreadable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Disease', disease);