const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Doctor = require('../db_models/Doctors');
const utils = new (require('../utils/utils'));
class SocketManager {
    constructor(server) {
        this.io = socketIO(server, {
            cors : {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
                transports: ["websocket", "polling"]
            },
            allowEIO3: true
        });
        this.init();
    }

    init() {

        this.io.use((socket, next) => {
            const token = socket.handshake.query.token;
            if (!token) {
                console.log('No token provided. Disconnecting socket.');
                return next(new Error('Authentication error'));
            }
            jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
                if (err) {
                    console.log('Invalid token. Disconnecting socket.');
                    return next(new Error('Authentication error')); // This will prevent the connection
                }

                if (!decoded.doctor_id) {
                    console.log('Token does not contain doctor_id. Disconnecting socket.');
                    return next(new Error('Authentication error')); // This will prevent the connection
                }
                socket.decoded = decoded;
                next();

            });
        });

        this.io.on('connection', (socket) => {
            console.log('Doctor connected: ', socket.decoded.doctor_id);

            socket.on('update_proximity_gps', async (gpsData) => {
                try {
                    console.log(gpsData);
                    const doctorId = socket.decoded.doctor_id;
                    const distance = utils.calculateDistance({
                        lat: process.env.HOSPITAL_LAT,
                        long: process.env.HOSPITAL_LONG
                    }, gpsData)
                    await Doctor.findOneAndUpdate(
                        { uId: doctorId },
                        { 
                            gps: gpsData,
                            distanceFromHospital: distance ,
                            lastSeen: new Date() 
                        },
                        { new: true, runValidators: true }
                    );
                    console.log('GPS data updated:', gpsData);
                } catch (err) {
                    console.error('Error updating GPS data:', err);
                }
            });

            socket.on('disconnect', () => {
                console.log('Doctor disconnected:', socket.id);
            });
        });
    }

    emit(event, data) {
        this.io.emit(event, data);
    }
    handleEvent(event, callback) {
        this.io.on('connection', (socket) => {
            socket.on(event, (data) => {
                callback(socket, data);
            });
        });
    }
}


module.exports = SocketManager;