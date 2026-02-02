const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated } = require('../utils/authMiddleware');

// Get checklist for a specific trip
router.get('/:tripId', isAuthenticated, async (req, res) => {
    try {
        const [tripRows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.tripId]);
        const trip = tripRows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const collaborators = trip.collaborators || [];
        const hasAccess = trip.user_id === req.user.id || collaborators.includes(req.user.username);
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized access to trip' });

        const [items] = await pool.query('SELECT * FROM checklists WHERE trip_id = ?', [req.params.tripId]);

        // Map snake_case to camelCase
        const camelitems = items.map(i => ({
            id: i.id,
            tripId: i.trip_id,
            text: i.text,
            isComplete: i.is_complete === 1,
            createdAt: i.created_at
        }));

        res.json(camelitems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to checklist
router.post('/:tripId', isAuthenticated, async (req, res) => {
    try {
        const [tripRows] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.tripId]);
        const trip = tripRows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const collaborators = trip.collaborators || [];
        const hasAccess = trip.user_id === req.user.id || collaborators.includes(req.user.username);
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        const newItem = {
            id: Date.now().toString(),
            tripId: req.params.tripId,
            text: req.body.text,
            isComplete: false
        };

        await pool.query(
            'INSERT INTO checklists (id, trip_id, text, is_complete) VALUES (?, ?, ?, ?)',
            [newItem.id, newItem.tripId, newItem.text, newItem.isComplete]
        );

        res.status(201).json({
            ...newItem,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle item complete / Update text
router.put('/:itemId', isAuthenticated, async (req, res) => {
    try {
        const [itemRows] = await pool.query('SELECT * FROM checklists WHERE id = ?', [req.params.itemId]);
        const item = itemRows[0];

        if (!item) return res.status(404).json({ error: 'Item not found' });

        // Check Access via Trip
        const [tripRows] = await pool.query('SELECT * FROM trips WHERE id = ?', [item.trip_id]);
        const trip = tripRows[0];

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        const collaborators = trip.collaborators || [];
        const hasAccess = trip.user_id === req.user.id || collaborators.includes(req.user.username);
        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        // Prepare Update
        const fields = [];
        const values = [];

        if (req.body.text !== undefined) {
            fields.push('text = ?');
            values.push(req.body.text);
        }
        if (req.body.isComplete !== undefined) {
            fields.push('is_complete = ?');
            values.push(req.body.isComplete ? 1 : 0);
        }

        if (fields.length > 0) {
            values.push(req.params.itemId);
            await pool.query(`UPDATE checklists SET ${fields.join(', ')} WHERE id = ?`, values);
        }

        const [updatedRows] = await pool.query('SELECT * FROM checklists WHERE id = ?', [req.params.itemId]);
        const updatedItem = updatedRows[0];

        res.json({
            id: updatedItem.id,
            tripId: updatedItem.trip_id,
            text: updatedItem.text,
            isComplete: updatedItem.is_complete === 1,
            createdAt: updatedItem.created_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete item
router.delete('/:itemId', isAuthenticated, async (req, res) => {
    try {
        const [itemRows] = await pool.query('SELECT * FROM checklists WHERE id = ?', [req.params.itemId]);
        const item = itemRows[0];

        if (!item) return res.status(404).json({ error: 'Item not found' });

        // Check Access
        const [tripRows] = await pool.query('SELECT * FROM trips WHERE id = ?', [item.trip_id]);
        const trip = tripRows[0];

        const collaborators = trip ? (trip.collaborators || []) : [];
        const hasAccess = trip && (trip.user_id === req.user.id || collaborators.includes(req.user.username));

        if (!hasAccess) return res.status(403).json({ error: 'Unauthorized' });

        await pool.query('DELETE FROM checklists WHERE id = ?', [req.params.itemId]);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
