const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../utils/authMiddleware');
const { readDb, writeDb } = require('../utils/db');

// Get all packages (Public)
router.get('/', async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.packages || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a package (Admin Only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        const newPackage = {
            id: Date.now().toString(),
            title: req.body.title, // e.g., "Paris Getaway"
            destination: req.body.destination,
            price: req.body.price,
            duration: req.body.duration, // e.g., "5 Days"
            description: req.body.description,
            image: req.body.image,
            activities: req.body.activities || [], // Array of strings or objects
            createdAt: new Date().toISOString()
        };

        if (!db.packages) db.packages = [];
        db.packages.push(newPackage);
        await writeDb(db);

        res.status(201).json(newPackage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a package (Admin Only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        const index = db.packages.findIndex(p => p.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'Package not found' });

        db.packages.splice(index, 1);
        await writeDb(db);
        res.json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
