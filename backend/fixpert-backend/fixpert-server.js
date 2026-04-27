
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
// Import Fixpert routes

const http = require('http');
const { Server } = require('socket.io');
const {setupSocket} = require('../websocket/socketHandler');


const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
app.set("io", io);   // 🔥 ADD THIS LINE
setupSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
const fixpertRoutes = require('./routes/fixpertRoutes');
app.use('/api/fixperts', fixpertRoutes);
app.use(express.static(path.join(__dirname, '../../frontend/public')));
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB for Fixpert Portal');
  require('../customer-backend/models/ServiceRequest');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Health check route
app.get('/', (req, res) => {
  res.send('Fixpert API is running 🚀');
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {      //        if any mistake replace server with server---------------------------------------------------------
  console.log(`🚀 Fixpert server running on http://localhost:${PORT}`);
});

