const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  uId: { type: String, required: true },
  pass: { type: String, require: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  experience: { type: Number, required: true },
  success_rate: { type: Number, require: true },
  patient_feedback: { type: Number, require: true },
  availability: {
    type: Boolean,
    default: false,
  },
  schedule: [{ // Time slots in 24-hour format
    date: { type: String, required: true },
    slots: [{
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      isAvailable: { type: Boolean, default: true },
      appointmentId: {type: String}
    }]
  }],
  gps: {
    type: {
      lat: { type: Number, required: true },
      long: { type: Number, required: true }
    },
    default: { lat: 0, long: 0 }
  },
  distanceFromHospital: {type: Number, require: true},
  lastSeen: { type: Date, default: null },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
