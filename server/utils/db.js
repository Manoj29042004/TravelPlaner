const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

async function readDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default structure
        if (error.code === 'ENOENT') {
            return { users: [], content: {}, trips: [] };
        }
        throw error;
    }
}

async function writeDb(data) {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDb, writeDb };
