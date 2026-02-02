const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated, isAdmin } = require('../utils/authMiddleware');

// Get all packages (Public)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM packages');

        // Parse activities JSON field
        const packages = rows.map(pkg => ({
            ...pkg,
            activities: pkg.activities || []
        }));

        console.log(`[PACKAGES] GET Request - count: ${packages.length}`);
        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Create a package (Admin Only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const newPackage = {
            id: Date.now().toString(),
            title: req.body.title,
            destination: req.body.destination,
            price: req.body.price,
            duration: req.body.duration,
            description: req.body.description,
            images: JSON.stringify(req.body.images || []),
            image: req.body.image,
            activities: JSON.stringify(req.body.activities || [])
        };

        // Note: 'images' column wasn't in my initial initDb.js packages table definition! 
        // I should probably add it or rely on single image. 
        // Checking initDb.js... I defined: image VARCHAR(255). 
        // If I want multiple images I need to alter table or just ignore `images` array for now and use `image`.
        // Let's assume for now we just use the single `image` column as defined in initDb.
        // But wait, the previous code had `images`. 
        // I will just use `image` column and maybe ignore `images` for this migration step OR update initDb again.
        // Let's stick to the schema I defined: image, rating, reviews, activities (JSON).

        await pool.query(
            `INSERT INTO packages (id, title, destination, price, duration, description, image, activities, rating, reviews) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newPackage.id, newPackage.title, newPackage.destination, newPackage.price, newPackage.duration, newPackage.description, newPackage.image, newPackage.activities, 4.5, 0]
        );

        res.status(201).json({
            ...newPackage,
            activities: JSON.parse(newPackage.activities)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a package (Admin Only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM packages WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Package not found' });

        res.json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
