const mongoose = require('mongoose');


const PatientSchema = new mongoose.Schema({
    patient_id: {type: String, required: true},
    pass: {type: String, required: true},
    name: {type: String, required: true},
    age: { type: Number, required: true },
    gender:  { type: String, enum: ['Male', 'Female', 'Third gender']},
    medical_history: {type: String, required: true},
    phone: { type: String, required: true },
})


module.exports = mongoose.model('Patient', PatientSchema);
