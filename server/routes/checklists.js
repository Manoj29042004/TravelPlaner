const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../utils/authMiddleware');
const { readDb, writeDb } = require('../utils/db');

// Get checklist for a specific trip
router.get('/:tripId', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const trip = db.trips.find(t => t.id === req.params.tripId);

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const hasAccess = trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username));
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized access to trip' });

        // Checklists are stored in a separate array in db.json for scalability in this design
        // Or could be part of trip. But keeping Separate collection pattern as per request.
        const items = (db.checklists || []).filter(item => item.tripId === req.params.tripId);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to checklist
router.post('/:tripId', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const trip = db.trips.find(t => t.id === req.params.tripId);

        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        const hasAccess = trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username));
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        if (!db.checklists) db.checklists = [];

        const newItem = {
            id: Date.now().toString(),
            tripId: req.params.tripId,
            text: req.body.text,
            isComplete: false,
            createdAt: new Date().toISOString()
        };

        db.checklists.push(newItem);
        await writeDb(db);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle item complete / Update text
router.put('/:itemId', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        if (!db.checklists) db.checklists = [];

        const itemIndex = db.checklists.findIndex(i => i.id === req.params.itemId);
        if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

        const item = db.checklists[itemIndex];
        const trip = db.trips.find(t => t.id === item.tripId);

        const hasAccess = trip && (trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username)));
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        const updatedItem = { ...item, ...req.body };
        db.checklists[itemIndex] = updatedItem;
        await writeDb(db);

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete item
router.delete('/:itemId', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        if (!db.checklists) db.checklists = [];

        const itemIndex = db.checklists.findIndex(i => i.id === req.params.itemId);
        if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

        const item = db.checklists[itemIndex];
        const trip = db.trips.find(t => t.id === item.tripId);

        const hasAccess = trip && (trip.userId === req.user.id || (trip.collaborators && trip.collaborators.includes(req.user.username)));
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        db.checklists.splice(itemIndex, 1);
        await writeDb(db);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
