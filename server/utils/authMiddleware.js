const { readDb } = require('./db');

async function isAuthenticated(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    // Token format: userId:::role

    try {
        const [uid, role] = token.split(':::');
        if (!uid || !role) throw new Error('Invalid token format');

        const db = await readDb();
        const user = db.users.find(u => u.id === uid);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username
        };
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Unauthorized' });
    }
}


function isAdmin(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.isSuperAdmin)) {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

module.exports = { isAuthenticated, isAdmin };
