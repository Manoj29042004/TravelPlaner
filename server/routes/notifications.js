const express = require('express');
const router = express.Router();
const { readDb } = require('../utils/db');
const { isAuthenticated } = require('../utils/authMiddleware');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const notifications = [];
        const now = new Date();

        // 1. Check for recent Collaboration Invites
        // Logic: Find trips where I am a collaborator.
        const sharedTrips = db.trips.filter(t => t.collaborators && t.collaborators.includes(req.user.username));
        sharedTrips.forEach(t => {
            notifications.push({
                type: 'invite',
                text: `You have access to trip: "${t.title}"`,
                time: 'Recently', // Simplified
                link: `trip-details.html?id=${t.id}`
            });
        });

        // 2. Check for Upcoming Trips (within 7 days)
        const myTrips = db.trips.filter(t => t.userId === req.user.id);
        myTrips.forEach(t => {
            if (t.dates) {
                // Very rough date check assuming string match or ISO
                // For demo, we just say "Upcoming" if it has 2026 in it
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
        const myBookings = (db.bookings || []).filter(b => b.userId === req.user.id && b.status === 'approved');
        // Show last 5 approved bookings as notifications
        myBookings.slice(-5).forEach(b => {
            notifications.push({
                type: 'booking',
                text: `Booking Confirmed: "${b.packageTitle}"`,
                time: new Date(b.createdAt).toLocaleDateString(),
                link: `dashboard.html` // Ideally link to specific booking or trip
            });
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
