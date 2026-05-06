const dns = require("dns");

// Force Node.js to use Google DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Now try resolving your MongoDB Atlas SRV record
dns.resolveSrv("_mongodb._tcp.cluster0.llosnyj.mongodb.net", (err, addresses) => {
  if (err) {
    console.error("DNS lookup failed:", err);
  } else {
    console.log("Resolved addresses:", addresses);
  }
});


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// Load env vars first
dotenv.config();

// Connect to DB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes here...
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));


const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server };
