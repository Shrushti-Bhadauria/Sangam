require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');
const { seedData } = require('./seed/seedData');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging for development/demo transparency
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/events/stream')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'SANGAM Interoperability Platform (SIH 2026)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// Serve frontend in production (Express v5 compatible catch-all)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    const indexPath = path.join(clientDist, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('SANGAM Interoperability Platform Backend is running.');
      }
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred on SANGAM gateway.'
  });
});

// Start Server
async function startServer() {
  try {
    await initDatabase();
    await seedData();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🏛️ SANGAM: Government Interoperability Platform`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🔗 Smart India Hackathon 2026 — Problem Statement 129`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();
