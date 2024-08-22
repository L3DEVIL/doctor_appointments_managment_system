const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: false },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false },
    status: { type: String, enum: ['Pending', 'Emergency', 'Done', "Expire" , 'Cancelled'], default: 'Pending' },
    slots: {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
    },
    case: {
        medical_history: {type: String},
        current_symptoms: {type: String, required: true},
        required_specialty: {type: String},
        severity: {type: Number},
        doctorStatement: {type: String, required: true},
    },
    createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Appointment', AppointmentSchema);
