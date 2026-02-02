const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated } = require('../utils/authMiddleware');

// Get all trips for the logged-in user (owned or shared)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Prepare the username as a JSON string for JSON_CONTAINS
        const usernameJson = JSON.stringify(req.user.username);

        const [rows] = await pool.query(
            `SELECT * FROM trips WHERE user_id = ? OR JSON_CONTAINS(collaborators, ?)`,
            [req.user.id, usernameJson]
        );

        // Parse JSON fields before returning
        const trips = rows.map(trip => ({
            ...trip,
            collaborators: trip.collaborators || [],
            itinerary: trip.itinerary || [],
            userId: trip.user_id // Map back to frontend expected property
        }));

        res.json(trips);
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new trip
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const newTrip = {
            id: Date.now().toString(),
            user_id: req.user.id,
            title: req.body.title,
            destination: req.body.destination,
            dates: req.body.dates,
            image: req.body.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
            description: req.body.description || '',
            collaborators: JSON.stringify([]),
            itinerary: JSON.stringify([])
        };

        await pool.query(
            `INSERT INTO trips (id, user_id, title, destination, dates, image, description, collaborators, itinerary) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newTrip.id, newTrip.user_id, newTrip.title, newTrip.destination, newTrip.dates, newTrip.image, newTrip.description, newTrip.collaborators, newTrip.itinerary]
        );

        res.status(201).json({
            ...newTrip,
            userId: newTrip.user_id,
            collaborators: [],
            itinerary: []
        });
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a specific trip
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        const trip = rows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const collaborators = trip.collaborators || [];
        const hasAccess = trip.user_id === req.user.id || collaborators.includes(req.user.username);

        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized access' });

        res.json({
            ...trip,
            userId: trip.user_id,
            collaborators: collaborators,
            itinerary: trip.itinerary || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a trip
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        const trip = rows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const collaborators = trip.collaborators || [];
        const hasAccess = trip.user_id === req.user.id || collaborators.includes(req.user.username);

        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        // Identify fields to update
        const fields = [];
        const values = [];

        if (req.body.title) { fields.push('title = ?'); values.push(req.body.title); }
        if (req.body.destination) { fields.push('destination = ?'); values.push(req.body.destination); }
        if (req.body.dates) { fields.push('dates = ?'); values.push(req.body.dates); }
        if (req.body.image) { fields.push('image = ?'); values.push(req.body.image); }
        if (req.body.description) { fields.push('description = ?'); values.push(req.body.description); }
        if (req.body.itinerary) { fields.push('itinerary = ?'); values.push(JSON.stringify(req.body.itinerary)); }

        if (fields.length > 0) {
            values.push(req.params.id);
            await pool.query(`UPDATE trips SET ${fields.join(', ')} WHERE id = ?`, values);
        }

        // Return updated trip
        const [updatedRows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        const updatedTrip = updatedRows[0];

        res.json({
            ...updatedTrip,
            userId: updatedTrip.user_id,
            collaborators: updatedTrip.collaborators || [],
            itinerary: updatedTrip.itinerary || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a trip
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        const trip = rows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        if (trip.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only owner can delete trip' });
        }

        await pool.query('DELETE FROM trips WHERE id = ?', [req.params.id]);
        res.json({ message: 'Trip deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Invite Collaborator
router.post('/:id/collaborators', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        const trip = rows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        if (trip.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can invite collaborators' });
        }

        const { username } = req.body;

        // Check if user exists
        const [userRows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

        const collaborators = trip.collaborators || [];
        if (!collaborators.includes(username)) {
            collaborators.push(username);
            await pool.query(
                'UPDATE trips SET collaborators = ? WHERE id = ?',
                [JSON.stringify(collaborators), req.params.id]
            );
        }

        res.json({ message: 'Collaborator added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
