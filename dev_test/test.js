const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Function to generate random coordinates within a radius
function getRandomCoordinates(lat, long, radius) {
    const toRadians = angle => angle * (Math.PI / 180);
    const toDegrees = angle => angle * (180 / Math.PI);

    const earthRadius = 6371; // Radius of the Earth in km
    const radiusInDegrees = radius / earthRadius;

    const randomRadius = radiusInDegrees * Math.sqrt(Math.random());
    const randomAngle = Math.random() * 2 * Math.PI;

    const deltaLat = randomRadius * Math.cos(randomAngle);
    const deltaLong = randomRadius * Math.sin(randomAngle) / Math.cos(toRadians(lat));

    const newLat = lat + toDegrees(deltaLat);
    const newLong = long + toDegrees(deltaLong);

    return { lat: newLat, long: newLong };
}

// Initialize token and socket connection
// const token = jwt.sign({ doctor_id: 'd60efd634' }, process.env.JWT_KEY, { expiresIn: '10m' });
const socket = io('http://localhost:5000', {
    query: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N0b3JfaWQiOiJkNjBlZmQ2MzQiLCJkb2N0b3JfbmFtZSI6IkRyLiBTaGFhbiBHdWhhIiwiaWF0IjoxNzI0MTc5NTM5LCJleHAiOjE3MjQxODU1Mzl9.HOtXAp0AWO013O43DVs0NC4VQCdkoCntEjpkiJnQj6I" }
});

socket.on('connect', () => {
    console.log('Connected to server');

    setTimeout(() => {
        const baseLat = 37.7749;
        const baseLong = -122.4194;
        const radius = 15; // Radius in km

        const randomCoordinates = getRandomCoordinates(baseLat, baseLong, radius);
        socket.emit('update_proximity_gps', randomCoordinates);
        console.log('Sent random GPS data:', randomCoordinates);
    }, 100); // 5 seconds delay
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
