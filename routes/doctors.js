const express = require('express');
const router = express.Router();
const security = new (require('../utils/security'));

const Doctor = require('../db_models/Doctors');
const Appointment = require('../db_models/Appointments');

router.post('/login', async (req, res) => {
    try {
        const { doctor_id, pass } = req.body;
        if (!doctor_id || !pass) {
            return res.status(400).json({ message: 'Patient ID and password are required and cannot be null.' });
        } 
        const doctor = await Doctor.findOne({ 
            uId : doctor_id,
            pass: pass
        });
        if (!doctor) {
            return res.status(401).json({ message: 'Invalid Doctor ID or password' });
        }
        const token = security.generateToken({ 
            doctor_id: doctor.uId,
            doctor_name: doctor.name,
        });
        res.status(200).json({
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/appointments', security.authenticateDoctor ,async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ uId: req.doctor.doctor_id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        const appointments = await Appointment.find({ doctorId: doctor._id }).populate('patientId').exec();
        if (!appointments.length) {
            return res.status(404).json({ message: 'No appointments found for this doctor' });
        }
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/appointment_result', security.authenticateDoctor, async (req, res) => {
    try {
        const { appointment_id } = req.body;
        if (!appointment_id) {
            return res.status(400).json({ message: 'Appointment Id required!' });
        }
        const doctor = await Doctor.findOne({ uId: req.doctor.doctor_id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        const appointments = await Appointment.findOne({
             doctorId: doctor._id,
             _id: appointment_id,
             status: 'Pending' 
        }).populate('patientId').exec();
        if (!appointments.length) {
            return res.status(404).json({ message: 'No appointments found for this doctor' });
        }
        appointments.status = 'Done';
        await appointments.save();

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;