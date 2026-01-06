const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../utils/authMiddleware');
const { readDb, writeDb } = require('../utils/db');

// Create a booking request (User)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const db = await readDb();
        const { packageId, customNotes } = req.body;

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
            status: 'pending', // pending, approved, rejected, info_required
            customNotes: customNotes || '',
            adminResponse: '', // Helper field for admin to reply
            createdAt: new Date().toISOString()
        };

        if (!db.bookings) db.bookings = [];
        db.bookings.push(newBooking);
        await writeDb(db);

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings (Admin Only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        res.json(db.bookings || []);
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

// Update booking status (Admin Only) - This "processes" the trip
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { status, adminNotes, adminResponse } = req.body; // status: 'approved' | 'rejected'
        const db = await readDb();

        const index = db.bookings.findIndex(b => b.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Booking not found' });

        const booking = db.bookings[index];
        if (status) booking.status = status;
        if (adminNotes) booking.adminNotes = adminNotes;
        if (adminResponse) booking.adminResponse = adminResponse;

        // If approved, strictly speaking, we could create a "Trip" entry for the user based on the package
        if (status === 'approved') {
            // Check if it's a package booking or custom
            let newTrip = null;

            if (booking.packageId) {
                const pkg = db.packages.find(p => p.id === booking.packageId);
                if (pkg) {
                    newTrip = {
                        id: Date.now().toString(),
                        userId: booking.userId,
                        title: pkg.title,
                        dates: "Dates TBD",
                        image: pkg.image,
                        description: pkg.description,
                        collaborators: [],
                        createdAt: new Date().toISOString(),
                        itinerary: pkg.activities.map((act, i) => ({
                            day: `Day ${i + 1}`,
                            title: act,
                            notes: 'Included in package'
                        }))
                    };
                }
            } else {
                // Custom Trip - Create a blank shell
                newTrip = {
                    id: Date.now().toString(),
                    userId: booking.userId,
                    title: "Custom Trip: " + (booking.customNotes.substring(0, 20) + "..."),
                    dates: "Dates TBD",
                    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop", // placeholder
                    description: booking.customNotes,
                    collaborators: [],
                    createdAt: new Date().toISOString(),
                    itinerary: []
                };
            }

            if (newTrip) {
                if (!db.trips) db.trips = [];
                db.trips.push(newTrip);
            }
        }

        await writeDb(db);
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
