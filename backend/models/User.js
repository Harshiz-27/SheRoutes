const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['Female', 'Male', 'Other', 'Prefer not to say'], default: 'Female' },
  emergencyContacts: [{
    name: { type: String },
    phone: { type: String }
  }],
  allowLocation: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
