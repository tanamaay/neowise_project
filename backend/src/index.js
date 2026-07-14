require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const { createNotificationService } = require('./services/notificationService');
const transactionService = require('./services/transactionService');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(process.env.MONGODB_URI, process.env.DB_NAME);

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  const notify = createNotificationService(io);
  transactionService.setNotificationEmitter(notify);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
