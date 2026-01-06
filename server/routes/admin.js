const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../utils/db');
const { isAuthenticated, isAdmin } = require('../utils/authMiddleware');

// Get all users (Admin only)
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        // Return users without sensitive info like password
        const usersSafe = db.users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            isSuperAdmin: !!u.isSuperAdmin
        }));
        res.json(usersSafe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new Admin (Only Super Admin can do this)
router.post('/create-admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        const requestor = db.users.find(u => u.id === req.user.id);

        if (!requestor || !requestor.isSuperAdmin) {
            return res.status(403).json({ error: 'Only Super Admin can create new admins' });
        }

        const { username, password, email } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        if (db.users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username exists' });
        }

        const newAdmin = {
            id: Date.now().toString(),
            username,
            password,
            email,
            role: 'admin',
            isSuperAdmin: false // Created admins are not super admins
        };

        db.users.push(newAdmin);
        await writeDb(db);

        res.status(201).json({ message: 'New admin created', admin: { username: newAdmin.username } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user (Admin only, cannot delete Super Admin)
router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const db = await readDb();
        const index = db.users.findIndex(u => u.id === req.params.id);

        if (index === -1) return res.status(404).json({ error: 'User not found' });

        const targetUser = db.users[index];
        if (targetUser.isSuperAdmin) {
            return res.status(403).json({ error: 'Cannot delete Super Admin' });
        }

        db.users.splice(index, 1);
        await writeDb(db);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
