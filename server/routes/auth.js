const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../utils/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('Register request:', req.body);
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            console.error('Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const db = await readDb();
        console.log('Current users:', db.users.map(u => u.username));

        if (db.users.find(u => u.username === username)) {
            console.error('Username exists:', username);
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
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
        const { username, password } = req.body;
        const db = await readDb();

        const user = db.users.find(u => u.username === username && u.password === password);

        if (!user) {
            console.error('Login failed for:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return a mock token (userId:::role) using a safer delimiter
        const token = `${user.id}:::${user.role}`;
        console.log('Login success:', username);
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
