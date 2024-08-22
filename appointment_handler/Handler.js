const Appointment = require('../db_models/Appointments');
const Doctor = require('../db_models/Doctors');
const moment = require('moment');
const axios = require('axios');

const getCaseRequiremnt = async (patient, current_symptoms) => {
    // Implement AI model using tensorflow to identify the requiremnt for the case
    const featureColumns = [
        'current_symptoms_Allergic Reactions', 'current_symptoms_Anxiety', 'current_symptoms_Arthritis',
        'current_symptoms_Blood Disorders', 'current_symptoms_Breathing Difficulty', 'current_symptoms_Chest Pain',
        'current_symptoms_Cold', 'current_symptoms_Cough', 'current_symptoms_Diarrhea', 'current_symptoms_Fatigue',
        'current_symptoms_Fever', 'current_symptoms_Headache', 'current_symptoms_High Blood Sugar',
        'current_symptoms_Infections', 'current_symptoms_Joint Pain', 'current_symptoms_Kidney Issues',
        'current_symptoms_Lump or Swelling', 'current_symptoms_Skin Rash', 'current_symptoms_Sore Throat',
        'current_symptoms_Stomach Pain', 'current_symptoms_Unknown Disease', 'current_symptoms_Urinary Issues',
        'current_symptoms_Vision Problems'
    ];

    const symptomToFeatureMap = featureColumns.reduce((acc, column) => {
        const symptom = column.replace('current_symptoms_', '').replace('_', ' ').toLowerCase();
        acc[symptom] = column;
        return acc;
    }, {});
    
    function mapSymptomsToFeatureColumns(symptomsInput) {
        const normalizedInput = symptomsInput.toLowerCase();
        const featuresObject = featureColumns.reduce((acc, column) => {
            acc[column] = false;
            return acc;
        }, {});
        Object.keys(symptomToFeatureMap).forEach(symptom => {
            if (normalizedInput.includes(symptom)) {
                featuresObject[symptomToFeatureMap[symptom]] = true;
            }
        });
        const filteredFeatures = Object.keys(featuresObject).filter(key => featuresObject[key]);
        return filteredFeatures;
    }
    const mappedFeatures = mapSymptomsToFeatureColumns(current_symptoms);
    if(mappedFeatures.length == 0) {
        mappedFeatures[0] = 'current_symptoms_Unknown Disease';
    }
    let api_status, api_mgs, predictions;
    try {
        const inputData = {};
        inputData['age'] = patient.age;
        inputData['gender_Female'] = patient.gender == "Female" ? 1 : 0 ;
        inputData['gender_Male'] = patient.gender == "Male" ? 1 : 0 ;
        inputData[mappedFeatures[0]] = 1;
        inputData['medical_history_No History'] =1
        const response = await axios.post(process.env.AI_MODEL_URL+'/predict', inputData);
        predictions = response.data;
        console.log('Predictions:', predictions);
        api_status = 200;
        api_mgs = "Done";
      } catch (error) {
        console.log(error);
        api_status = 501;
        api_mgs = error;
    }
    console.log(predictions)
    return {
        status: api_status,
        mgs: api_mgs,
        specialty : predictions.pred_specialty[0] || 'General Medicine',
        severity: predictions.pred_severity[0] || 3,
        minExperience : predictions.pred_experience[0] || 5,
        minSuccessRate: predictions.pred_success_rate[0] || 60,
        minFeedbackScore: predictions.pred_feedback[0] || 1.5,
    }
}

const appointment = async (patient, slot, current_symptoms) => {

    const requestedDate = slot.requestedDate;
    const [requestedStartTime, requestedEndTime] = slot.timeRange.split('-');
   
    const endDateTime = new Date(`${requestedDate}T${requestedEndTime}:00.000Z`);
    console.log(endDateTime);
    const currentDateTime = new Date();
    console.log(currentDateTime);
    if (currentDateTime > endDateTime) {
        console.log(currentDateTime);
        return {
            status: 501, data: {
                msg: "Please provide a vaild date and time",
            },
        };    
    }

    const {
        status,
        mgs,
        specialty,
        severity,
        minExperience,
        minSuccessRate,
        minFeedbackScore
    } = await getCaseRequiremnt(patient, current_symptoms);

    if (status !== 200) {
        return {
            status: status, data: {
                msg: msg,
            },
        };
    }


    const existingAppointment = await Appointment.findOne({
        patientId: patient._id,
        status: 'Pending'
    });

    if (existingAppointment) {
        return {
            status: 400, data: {
                msg: 'You already have a pending appointment',
            },
        };
    }

    let doctor = await Doctor.findOne({
        availability: true,
        specialty: specialty,
        experience: { $gte: minExperience },
        success_rate: { $gte: minSuccessRate },
        patient_feedback: { $gte: minFeedbackScore },
        distanceFromHospital: { $lte: 2 },
        'schedule': {
            $elemMatch: {
                date: { $eq: slot.requestedDate },
                'slots': {
                    $elemMatch: {
                        startTime: requestedStartTime,
                        endTime: requestedEndTime,
                        isAvailable: true
                    }
                }
            }
        }
    },'-pass');

    if (!doctor) {
        return { status: 404, data: { msg: 'Doctor not found' } };
    }

    const newAppointment = new Appointment({
        patientName: patient.name,
        patientPhone: patient.phone,
        patientId: patient._id, 
        doctorId: doctor._id,
        status: 'Pending',
        slots: {
            date: slot.requestedDate,
            startTime: requestedStartTime,
            endTime: requestedEndTime,
        },

        case: {
            medical_history: patient.medical_history,
            current_symptoms: current_symptoms,
            required_specialty: specialty,
            severity: severity,
            doctorStatement: 'None',
        },
    });

    const savedAppointment = await newAppointment.save();

    const slotDate = doctor.schedule.find(s => s.date === slot.requestedDate);
    const availableSlot = slotDate.slots.find(s => s.startTime === requestedStartTime && s.endTime === requestedEndTime && s.isAvailable);
    availableSlot.isAvailable = false;
    availableSlot.appointmentId = savedAppointment._id;

    await Doctor.findOneAndUpdate(
        { _id: doctor._id, 'schedule.date': slot.requestedDate },
        { $set: { 'schedule.$.slots': slotDate.slots } },
        { new: true, runValidators: true }
    );

    // Return success response
    return {
        status: 200,
        data: {
            appointment: {

                appointment_id: savedAppointment._id,
                doctor_name: doctor.name,
                doctor_specialty: doctor.specialty,
                doctor_id: doctor._id,
                slot: {
                    date: slot.requestedDate,
                    time: `${requestedStartTime}-${requestedEndTime}`,
                },
                status: 'Pending',
            },
            msg: 'Appointment booked successfully',
        },
    };
}


const cancelAppointment = async (patientId, appointmentId) => {
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        patientId: patientId,
        status: 'Pending'
    });
    if (!appointment) {
        return {
            status: 404, data: {
                msg: 'Appointment not found',
            },
        };
    }
    appointment.status = 'Cancelled';
    await appointment.save();

    // Find the doctor associated with the appointment
    const doctor = await Doctor.findById(appointment.doctorId);
    if (!doctor) {
        return {
            status: 404, data: {  msg: 'Doctor not found' },
        };
    }

    const slotDateIndex = doctor.schedule.findIndex(s => moment(s.date).isSame(appointment.slots.date, 'day'));
    if (slotDateIndex === -1) {
        return {
                status: 404, data: { msg: 'Date not found in doctor schedule' },
        };
    }
    const slotIndex = doctor.schedule[slotDateIndex].slots.findIndex(s =>
        s.startTime === appointment.slots.startTime && s.endTime === appointment.slots.endTime
    );
    if (slotIndex === -1) {
        return {
             status: 404, data: { msg: 'Time slot not found in doctor schedule' },
        };
    }
    doctor.schedule[slotDateIndex].slots[slotIndex].isAvailable = true;
    doctor.schedule[slotDateIndex].slots[slotIndex].appointmentId = null;
    await doctor.save();

    // Return success response
    return {
        status: 200,
        data: {
            msg: 'Appointment canceled successfully',
        },
    };
}

const getAllAppointments = async (patient_Id) => {
    const expire_appoitment = await Appointment.find({
        patientId: patient_Id,
        status: 'Pending'
    });

    for (let i = 0; i < expire_appoitment.length; i++) {
        const appointment = expire_appoitment[i];
        // console.log(appointment);
        console.log(appointment.slots.date.toISOString().slice(0, 10));
        const endDateTime = new Date(`${appointment.slots.date.toISOString().slice(0, 10)}T${appointment.slots.endTime}:00.000Z`);
        const currentDateTime = new Date();
        if (currentDateTime > endDateTime) {
            const exp_appointment = await Appointment.findOne({
                _id: expire_appoitment[i]._id,
                status: 'Pending'
            });
            exp_appointment.status = 'Expire';
            await exp_appointment.save();
        }
    }
    
    // const appointments = await Appointment.find({ patientId: patient_Id });
    let query = Appointment.find({ patientId: patient_Id }).populate('doctorId', 'name').sort({ createdAt: -1 });
    if (true) {
        query = query.limit(2);
    }
    const appointments = await query;
    if (!appointments.length) {
        return { status: 404, data: { msg: 'No appointments found for this patient' } };
    }
    return { status: 200, data: { msg: 'Success' , appointments : appointments} };
};

  
module.exports = { appointment, cancelAppointment, getAllAppointments };