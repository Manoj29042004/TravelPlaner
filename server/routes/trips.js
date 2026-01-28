const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../utils/authMiddleware');
const { readDb, writeDb } = require('../utils/db');

// Get all trips for the logged-in user (owned or shared)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const trips = db.trips.filter(t =>
            t.userId === req.user.id ||
            (t.collaborators && t.collaborators.includes(req.user.username))
        );
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new trip
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const newTrip = {
            id: Date.now().toString(),
            userId: req.user.id,
            title: req.body.title,
            destination: req.body.destination,
            dates: req.body.dates,
            image: req.body.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
            description: req.body.description || '',
            collaborators: [],
            createdAt: new Date().toISOString(),
            itinerary: []
        };

        db.trips.push(newTrip);
        await writeDb(db);

        res.status(201).json(newTrip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific trip
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const trip = db.trips.find(t => t.id === req.params.id);

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const hasAccess = trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username));
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized access' });

        res.json(trip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a trip
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const index = db.trips.findIndex(t => t.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'Trip not found' });

        const trip = db.trips[index];
        const hasAccess = trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username));

        // Allow collaborators to update itinerary, but maybe restriction on other fields?
        // For simplicity, allow edit if access.
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        const updatedTrip = { ...trip, ...req.body };
        db.trips[index] = updatedTrip;
        await writeDb(db);

        res.json(updatedTrip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a trip
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const index = db.trips.findIndex(t => t.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'Trip not found' });
        if (db.trips[index].userId !== req.user.id) {
            return res.status(403).json({ error: 'Only owner can delete trip' });
        }

        db.trips.splice(index, 1);
        await writeDb(db);
        res.json({ message: 'Trip deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Invite Collaborator
router.post('/:id/collaborators', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const tripIndex = db.trips.findIndex(t => t.id === req.params.id);

        if (tripIndex === -1) return res.status(404).json({ error: 'Trip not found' });
        if (db.trips[tripIndex].userId !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can invite collaborators' });
        }

        const { username } = req.body;
        const userExists = db.users.find(u => u.username === username);
        if (!userExists) return res.status(404).json({ error: 'User not found' });

        if (!db.trips[tripIndex].collaborators.includes(username)) {
            db.trips[tripIndex].collaborators.push(username);
            await writeDb(db);
        }

        res.json({ message: 'Collaborator added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
