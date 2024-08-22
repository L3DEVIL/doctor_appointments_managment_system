const express = require('express');
const router = express.Router();
const Patient = require('../db_models/Patient');
const  {appointment, em_appointment, cancelAppointment, getAllAppointments} = require('../appointment_handler/Handler')
const security = new (require('../utils/security'));
const utils = new (require('../utils/utils'));

router.get('/', async (req, res) => {
    try {
      res.json({

      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, pass, age, gender, medical_history, phone } = req.body;
    if (!name || !pass || !age || !gender || !medical_history || !phone) {
      return res.status(400).json({ message: 'All fields are required and cannot be null.' });
    }  
    const hash_pass = security.hashData(pass);
    const newPatient = new Patient({
      patient_id: security.generateUniqueString(8),
      name: name,
      pass: hash_pass,
      age: age,
      gender: gender,
      medical_history: medical_history,
      phone: phone
    });
    const patient = await newPatient.save();
    const token = security.generateToken({
      patient_id : patient.patient_id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      medical_history: patient.medical_history,
      phone: patient.phone,
    });
    res.status(200).json({ message: 'Signup successful', token: token });
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

router.post('/login', async (req, res) => {
  try {
    const { patient_id, pass } = req.body;
    if (!patient_id || !pass) {
      return res.status(400).json({ message: 'Patient ID and password are required and cannot be null.' });
    }  
    const hash_pass = security.hashData(pass);
    const patient = await Patient.findOne({ 
      patient_id : patient_id,
      pass: hash_pass
    });
    if (patient) {
      const token = security.generateToken({
        patient_id : patient.patient_id,
        age: patient.age,
        gender: patient.gender,
        medical_history: patient.medical_history,
        phone: patient.phone,
      });
      console.log(token);

      res.status(200).json({ message: 'Login successful', token: token });
    } else {
      res.status(401).json({ message: 'Invalid patient ID or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/profile', security.authenticateToken , async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.patient.patient_id }, '-pass');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(200).json({ message: "Success", data: patient });
  } catch(error) {
    res.status(500).json({ message: 'Internal server error: '+error });
  }
})

router.post('/appointment', security.authenticateToken ,async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.patient.patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const {slot, current_symptoms, type } = req.body;
    let status, data;
    switch(type) {
      case 1:
        ({status, data} = await appointment(patient, slot, current_symptoms));
        break;
      case 0:
        ({status, data} = await em_appointment(patient));
        break;
      default:
        return res.status(400).json({ message: "Invalid appointment type", data: null });
    }
    res.status(status).json({ message: data.msg, data: data.appointment });

  } catch(error) {
    res.status(500).json({ message: 'Internal server error: '+error });
  }
});

router.post('/all_appointment', security.authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.patient.patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const { status, data } = await getAllAppointments(patient._id);
    res.status(status).json({ message: data.msg, appointment: data.appointments})
  } catch(error) {
    res.status(500).json({ message: 'Internal server error: '+error });
  }
});

router.post('/cancel_appointment', security.authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.patient.patient_id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const { appointment_id } = req.body;
    if (!appointment_id) {
      return res.status(400).json({ message: 'Appointment Id required!' });
    }  

    const {status, data} = await cancelAppointment(patient._id, appointment_id)
    res.status(status).json({ message: data.msg });
  } catch(error) {
    res.status(500).json({ message: 'Internal server error: '+error });
  }
});

router.get('/slots', (req,res) => {
  res.json(utils.createScheduleForNextDays());
})

module.exports = router;