const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../utils/db');
const { isAuthenticated } = require('../utils/authMiddleware');

// GET /api/auth/me - Verify token and get user info
router.get('/me', isAuthenticated, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            email: req.user.email,
            avatar: req.user.avatar,
            bio: req.user.bio,
            dreamDestination: req.user.dreamDestination
        }
    });
});

// PUT /api/auth/me - Update user profile
router.put('/me', isAuthenticated, async (req, res) => {
    try {
        const { k } = req.body;
        // In a real app we'd validate these fields
        const updates = req.body;

        const db = await readDb();
        const userIndex = db.users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Merge updates
        const updatedUser = { ...db.users[userIndex], ...updates };
        // Prevent strictly immutable fields from being changed if necessary (like id), but for now simple merge is fine

        db.users[userIndex] = updatedUser;
        await writeDb(db);

        res.json({
            message: 'Profile updated',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                dreamDestination: updatedUser.dreamDestination
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('Register request:', req.body);
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            console.error('Missing username, password, or email');
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const db = await readDb();

        if (db.users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // In a real app, hash this!
            role: 'user'
        };

        db.users.push(newUser);
        await writeDb(db);
        console.log('User registered:', newUser.username);

        res.status(201).json({ message: 'User registered successfully', user: { username: newUser.username, role: newUser.role } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    console.log('Login request:', req.body);
    try {
        const { email, password } = req.body;
        const db = await readDb();

        const user = db.users.find(u => u.email === email && u.password === password);

        if (!user) {
            console.error('Login failed for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return a mock token (userId:::role) using a safer delimiter
        const token = `${user.id}:::${user.role}`;
        console.log('Login success:', email);
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
