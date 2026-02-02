const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated } = require('../utils/authMiddleware');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notifications = [];
        const now = new Date();

        // 1. Check for recent Collaboration Invites
        const usernameJson = JSON.stringify(req.user.username);
        const [sharedTrips] = await pool.query(
            'SELECT * FROM trips WHERE JSON_CONTAINS(collaborators, ?)',
            [usernameJson]
        );

        sharedTrips.forEach(t => {
            notifications.push({
                type: 'invite',
                text: `You have access to trip: "${t.title}"`,
                time: 'Recently',
                link: `trip-details.html?id=${t.id}`
            });
        });

        // 2. Check for Upcoming Trips (within 7 days or matching string)
        const [myTrips] = await pool.query('SELECT * FROM trips WHERE user_id = ?', [req.user.id]);
        myTrips.forEach(t => {
            if (t.dates) {
                // Rough check: matches 2026
                if (t.dates.includes('2026')) {
                    notifications.push({
                        type: 'reminder',
                        text: `Upcoming trip: "${t.title}"`,
                        time: 'Soon',
                        link: `trip-details.html?id=${t.id}`
                    });
                }
            }
        });

        // 3. Check for Recent Bookings (Approved)
        const [myBookings] = await pool.query(
            'SELECT * FROM bookings WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 5',
            [req.user.id, 'approved']
        );

        myBookings.forEach(b => {
            notifications.push({
                type: 'booking',
                text: `Booking Confirmed: "${b.package_title}"`,
                time: new Date(b.created_at).toLocaleDateString(),
                link: `dashboard.html`
            });
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
