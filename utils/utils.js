const moment = require('moment');

class Utils {
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    calculateDistance(coord1, coord2) {
        const R = 6371; // Radius of Earth in kilometers
        const lat1 = this.toRadians(coord1.lat);
        const lon1 = this.toRadians(coord1.long);
        const lat2 = this.toRadians(coord2.lat);
        const lon2 = this.toRadians(coord2.long);
    
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
    
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    createTimeSlots = (slot_num = 10, duration=1) => {
        const slots = [];
        let startTime = moment("09:00", "HH:mm"); // Start from 9:00 AM
        for (let i = 0; i < slot_num; i++) { // Create 10 slots
            let endTime = moment(startTime).add(duration, 'hours'); // Each slot is 1 hour long
            slots.push({
                startTime: startTime.format("HH:mm"),
                endTime: endTime.format("HH:mm"),
            });
            startTime = endTime; // Move to the next time slot
        }
        return slots;
    }

    createScheduleForNextDays = (slots = 10, duration=1, days=5) => {
        const schedule = [];
        for (let i = 0; i < days; i++) {
            let date = moment().add(i, 'days').format('YYYY-MM-DD'); // Generate dates for next 5 days
            schedule.push({
                date: date,
                slots: this.createTimeSlots(slots, duration)
            });
        }
        return schedule;
    }
}


module.exports = Utils;