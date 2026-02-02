const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});



// Firebase Admin removed in favor of Local JSON DB (Now Migrated to MySQL)
// const { readDb } = require('./utils/db');

// Ensure DB exists / Initialize MySQL Tables
const initDb = require('./scripts/initDb');

// We will run initDb() inside app.listen or before it to ensure tables exist

// API Routes
const tripsRoutes = require('./routes/trips');
const checklistsRoutes = require('./routes/checklists');
const collaborationRoutes = require('./routes/collaboration');
const authRoutes = require('./routes/auth');

const packagesRoutes = require('./routes/packages');
const bookingsRoutes = require('./routes/bookings');
const notificationsRoutes = require('./routes/notifications');

// Mount Routes
app.use('/api/trips', tripsRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.use(express.static(path.join(__dirname, '../public/html')));
app.use(express.static(path.join(__dirname, '../public')));

// Serve Frontend for any other route (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

// Start Server
const startServer = async () => {
    try {
        await initDb();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server due to DB init error:', error);
    }
};

startServer();
