const express = require('express');
const router = express.Router();
const pool = require('../config/db');
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
        const { bio, avatar, dreamDestination } = req.body;

        await pool.query(
            'UPDATE users SET bio = ?, avatar = ?, dreamDestination = ? WHERE id = ?',
            [bio, avatar, dreamDestination, req.user.id]
        );

        // Fetch updated user to return
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const updatedUser = rows[0];

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
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password, // In a real app, hash this!
            role: 'user'
        };

        await pool.query(
            'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [newUser.id, newUser.username, newUser.email, newUser.password, newUser.role]
        );

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

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        const user = rows[0];

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
