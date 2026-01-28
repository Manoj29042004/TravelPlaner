const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../utils/authMiddleware');
const { readDb, writeDb } = require('../utils/db');

// Create a booking request (User)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const { packageId, customNotes } = req.body;
        console.log(`[BOOKING] POST Request - User: ${req.user.username} (${req.user.id}) - Pkg: ${packageId}`);


        // Logic for Custom vs Package Booking
        let packageTitle = 'Custom Request';
        if (packageId) {
            const pkg = (db.packages || []).find(p => p.id === packageId);
            if (pkg) {
                packageTitle = pkg.title;
            } else {
                // If package provided but not found, maybe just mark as custom or return error?
                // Let's default to Custom Request if ID not found but still proceed? 
                // Or better, return 404 if ID was explicitly sent but invalid.
                // But for flexibility let's just proceed.
            }
        }

        const newBooking = {
            id: Date.now().toString(),
            userId: req.user.id,
            username: req.user.username,
            packageId: packageId || null,
            packageTitle,
            status: 'approved', // AUTO-APPROVE
            customNotes: customNotes || '',
            adminResponse: 'Your trip has been instantly confirmed! Happy Travels.',
            createdAt: new Date().toISOString()
        };

        if (!db.bookings) db.bookings = [];
        db.bookings.push(newBooking);

        // --- Auto-Create Trip Logic ---
        let newTrip = null;
        if (packageId) {
            const pkg = (db.packages || []).find(p => p.id === packageId);
            if (pkg) {
                // Generate detailed itinerary if available, or simpler one
                let tripItinerary = [];
                if (pkg.activities && Array.isArray(pkg.activities)) {
                    tripItinerary = pkg.activities.map((act, i) => ({
                        day: `Day ${i + 1}`,
                        title: act,
                        notes: 'Included in package'
                    }));
                }

                newTrip = {
                    id: Date.now().toString() + "-trip",
                    userId: req.user.id,
                    title: pkg.title,
                    dates: "Dates TBD",
                    image: pkg.image || 'https://via.placeholder.com/800',
                    description: pkg.description,
                    collaborators: [],
                    createdAt: new Date().toISOString(),
                    itinerary: tripItinerary
                };
            }
        } else {
            // Custom Trip
            newTrip = {
                id: Date.now().toString() + "-trip",
                userId: req.user.id,
                title: "Custom Trip: " + (packageTitle === 'Custom Request' ? 'My Custom Adventure' : packageTitle),
                dates: "Dates TBD",
                image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop",
                description: customNotes || "Custom trip request.",
                collaborators: [],
                createdAt: new Date().toISOString(),
                itinerary: []
            };
        }

        if (newTrip) {
            if (!db.trips) db.trips = [];
            db.trips.push(newTrip);
        }

        await writeDb(db);

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get my bookings (User)
router.get('/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const myBookings = (db.bookings || []).filter(b => b.userId === req.user.id);
        res.json(myBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
