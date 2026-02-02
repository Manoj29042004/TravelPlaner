const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated } = require('../utils/authMiddleware');

// Create a booking request (User)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { packageId, customNotes } = req.body;
        console.log(`[BOOKING] POST Request - User: ${req.user.username} (${req.user.id}) - Pkg: ${packageId}`);

        let packageTitle = 'Custom Request';
        let packageDetails = null;

        // Fetch Package Details if ID provided
        if (packageId) {
            const [pkgRows] = await pool.query('SELECT * FROM packages WHERE id = ?', [packageId]);
            if (pkgRows.length > 0) {
                packageDetails = pkgRows[0];
                packageTitle = packageDetails.title;
            }
        }

        const newBooking = {
            id: Date.now().toString(),
            user_id: req.user.id,
            username: req.user.username,
            package_id: packageId || null,
            package_title: packageTitle,
            status: 'approved', // AUTO-APPROVE
            custom_notes: customNotes || '',
            admin_response: 'Your trip has been instantly confirmed! Happy Travels.'
        };

        // Insert Booking
        await pool.query(
            `INSERT INTO bookings (id, user_id, username, package_id, package_title, status, custom_notes, admin_response) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newBooking.id, newBooking.user_id, newBooking.username, newBooking.package_id, newBooking.package_title, newBooking.status, newBooking.custom_notes, newBooking.admin_response]
        );

        // --- Auto-Create Trip Logic ---
        if (packageDetails) {
            const tripId = Date.now().toString() + "-trip";

            // We need to parse activities from package if it exists as JSON
            let tripItinerary = [];
            if (packageDetails.activities) {
                // It might come as a string from DB or object if mysql2 casts it
                // Let's assume mysql2 auto-casts JSON columns if configured, strict check
                const activities = Array.isArray(packageDetails.activities) ? packageDetails.activities : (packageDetails.activities ? JSON.parse(packageDetails.activities) : []);

                tripItinerary = activities.map((act, i) => ({
                    day: `Day ${i + 1}`,
                    title: act,
                    notes: 'Included in package'
                }));
            }

            await pool.query(
                `INSERT INTO trips (id, user_id, title, destination, dates, image, description, collaborators, itinerary) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tripId,
                    req.user.id,
                    packageDetails.title,
                    "Dates TBD",
                    packageDetails.dates || "Dates TBD", // Fallback if dates not in package
                    packageDetails.image || 'https://via.placeholder.com/800',
                    packageDetails.description,
                    JSON.stringify([]),
                    JSON.stringify(tripItinerary)
                ]
            );
        } else {
            // Custom Trip
            const tripId = Date.now().toString() + "-trip";
            await pool.query(
                `INSERT INTO trips (id, user_id, title, destination, dates, image, description, collaborators, itinerary) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tripId,
                    req.user.id,
                    "Custom Trip: " + (packageTitle === 'Custom Request' ? 'My Custom Adventure' : packageTitle),
                    "Dates TBD", // Destination
                    "Dates TBD",
                    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop",
                    customNotes || "Custom trip request.",
                    JSON.stringify([]),
                    JSON.stringify([])
                ]
            );
        }

        res.status(201).json({
            ...newBooking,
            userId: newBooking.user_id,
            packageId: newBooking.package_id,
            packageTitle: newBooking.package_title,
            customNotes: newBooking.custom_notes,
            adminResponse: newBooking.admin_response
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get my bookings (User)
router.get('/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ?', [req.user.id]);

        // Map back to camelCase for frontend consistency if needed, or keeping snake_case is fine if frontend adapts.
        // Let's map to camelCase to match previous JSON structure to minimize frontend breakage.
        const myBookings = rows.map(b => ({
            id: b.id,
            userId: b.user_id,
            username: b.username,
            packageId: b.package_id,
            packageTitle: b.package_title,
            status: b.status,
            customNotes: b.custom_notes,
            adminResponse: b.admin_response,
            createdAt: b.created_at
        }));

        res.json(myBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
