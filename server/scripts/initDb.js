const pool = require('../config/db');

async function initDb() {
    try {
        console.log('Initializing database tables...');

        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                avatar VARCHAR(255),
                bio TEXT,
                dreamDestination VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table checked/created');

        // Packages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS packages (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                image VARCHAR(255),
                rating DECIMAL(2, 1),
                reviews INT,
                duration VARCHAR(50),
                activities JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Packages table checked/created');

        // Trips Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                destination VARCHAR(255),
                dates VARCHAR(255),
                image VARCHAR(255),
                description TEXT,
                collaborators JSON,
                itinerary JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Trips table checked/created');

        // Bookings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                username VARCHAR(255),
                package_id VARCHAR(255),
                package_title VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                custom_notes TEXT,
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Bookings table checked/created');

        // Checklists Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS checklists (
                id VARCHAR(255) PRIMARY KEY,
                trip_id VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                is_complete BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
            )
        `);
        console.log('Checklists table checked/created');

        console.log('Database initialization complete');
        // process.exit(0); // Removed for auto-run in server.js
    } catch (error) {
        console.error('Error initializing database:', error);
        // process.exit(1); // Removed for auto-run in server.js, let server handle error
    }
}

module.exports = initDb;

// Only run standalone if called directly from command line
if (require.main === module) {
    initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
