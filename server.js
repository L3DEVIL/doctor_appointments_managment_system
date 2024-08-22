const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');

const http = require('http');
const socketIo = require('socket.io');
const SocketManager = require('./socket_io/Manager');
const updateScheduleForDoctors = require('./utils/cronJobs');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new SocketManager(server);

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

updateScheduleForDoctors();
// day: 0 0 * * *     , 30sec: */30 * * * * *
cron.schedule('0 0 * * *', async () => {
  console.log('Running schedule update job...');
  try {
    await updateScheduleForDoctors();
    console.log('Schedule update completed!');
  } catch (error) {
    console.error('Error during schedule update:', error);
  }
});

app.use(express.json());
app.use('/web', require('./routes/react'));
app.use('/app', require('./routes/patient'));
app.use('/doctors', require('./routes/doctors'));

app.get('/', async (req, res) => {
  res.redirect('/web');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));