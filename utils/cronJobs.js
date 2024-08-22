const moment = require('moment');
const Doctor = require('../db_models/Doctors');

// Function to create time slots for a single day
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

// Function to create schedule starting from the last available date
const createScheduleForDays = (days, lastDate) => {
  const schedule = [];
  let startDate = lastDate ? moment(lastDate).add(1, 'days') : moment(); // Start from the next day after lastDate or today

  for (let i = 0; i < days; i++) {
      let date = startDate.add(i === 0 ? 0 : 1, 'days').format('YYYY-MM-DD'); // Generate next date
      schedule.push({
          date: date,
          slots: createTimeSlots()
      });
  }
  return schedule;
};

// Function to update the schedule for all doctors
const updateScheduleForDoctors = async () => {
  try {
    const doctors = await Doctor.find();

    for (let doctor of doctors) {
      const existingScheduleDates = doctor.schedule.map(s => s.date);
      const currentDate = moment().format('YYYY-MM-DD');

      // Filter only future dates from the current schedule
      const validScheduleDates = existingScheduleDates.filter(date => moment(date).isSameOrAfter(currentDate));

      const scheduleDaysCount = validScheduleDates.length;

      if (scheduleDaysCount < 5) {
        // Calculate how many more days are needed
        const daysNeeded = 5 - scheduleDaysCount;

        // Get the last scheduled date
        const lastDate = validScheduleDates.length > 0 ? validScheduleDates[validScheduleDates.length - 1] : null;

        // Generate the new schedule starting from the last scheduled date
        const newSchedule = createScheduleForDays(daysNeeded, lastDate);

        // Add only unique new dates to the existing schedule
        for (let newDate of newSchedule) {
          if (!existingScheduleDates.includes(newDate.date)) {
            doctor.schedule.push(newDate);
          }
        }

        // Save the updated schedule for the doctor
        await doctor.save();
        console.log(`Schedule updated for doctor ${doctor._id}`);
      }
    }

    console.log('Schedule update complete!');
  } catch (error) {
    console.error('Error updating schedules:', error);
  }
};

module.exports = updateScheduleForDoctors;
