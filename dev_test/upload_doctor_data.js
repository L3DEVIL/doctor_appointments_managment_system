const Doctor = require('./db_models/Doctors');
const fs = require('fs');
const moment = require('moment');
const csv = require('csv-parser');


const createTimeSlots = () => {
  const slots = [];
  let startTime = moment("09:00", "HH:mm"); // Start from 9:00 AM
  for (let i = 0; i < 10; i++) { // Create 10 slots
      let endTime = moment(startTime).add(1, 'hours'); // Each slot is 1 hour long
      slots.push({
          startTime: startTime.format("HH:mm"),
          endTime: endTime.format("HH:mm"),
          isAvailable: true,
          appointmentId: null
      });
      startTime = endTime; // Move to the next time slot
  }
  return slots;
};

// Schedule generation for the next 5 days
const createScheduleForNext5Days = () => {
  const schedule = [];
  for (let i = 0; i < 5; i++) {
      let date = moment().add(i, 'days').format('YYYY-MM-DD'); // Generate dates for next 5 days
      schedule.push({
          date: date,
          slots: createTimeSlots()
      });
  }
  return schedule;
};

const crypto = require('crypto');
function generateUniqueString(length = 8) {
  const bytes = crypto.randomBytes(length);
  return 'd' + bytes.toString('hex').slice(0, length);
}
const generateRandomNumericPassword = (length = 7) => {
  const digits = '0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return password;
};

// Read CSV and insert data into MongoDB
const doctors = [];
fs.createReadStream('./ai_models/doctors_data.csv') // Path to your CSV file
  .pipe(csv())
  .on('data', (row) => {
    doctors.push({
      uId: generateUniqueString(),                         // Required field: doctor_id
      name: row['name'],                             // Required field: name
      pass: generateRandomNumericPassword(),
      specialty: row['specialty'],                   // Required field: specialty
      experience: parseInt(row['experience_years'], 10), // Required field: experience_years
      success_rate: parseFloat(row['success_rate']),           // Required field: success_rate
      patient_feedback: parseFloat(row['patient_feedback']),    // Required field: patient_feedback
      availability: true,
      // Optional fields can be added here as needed
    });
  })
  .on('end', async () => {
    try {
      await Doctor.insertMany(doctors);
      console.log('Doctors inserted successfully!');
    } catch (error) {
      console.error('Error inserting doctors:', error);
    } finally {
      // mongoose.connection.close();
      addScheduleToAllDoctors();
    }
  });

  const addScheduleToAllDoctors = async () => {
    try {
        const doctors = await Doctor.find();
        const schedule = createScheduleForNext5Days();
        
        for (let doctor of doctors) {
            doctor.schedule = schedule; // Assign the schedule to the doctor
            await doctor.save();        // Save the doctor with the new schedule
        }

        console.log('Schedule added to all doctors successfully!');
    } catch (error) {
        console.error('Error updating doctors with schedule:', error);
    } finally {
        // mongoose.connection.close(); // Close the connection once done
    }
};
