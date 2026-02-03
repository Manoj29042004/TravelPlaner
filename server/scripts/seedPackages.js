const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function seedPackages() {
    try {
        const dbPath = path.join(__dirname, '../data/db.json');
        const fileData = fs.readFileSync(dbPath, 'utf8');
        const jsonData = JSON.parse(fileData);
        const packages = jsonData.packages || [];

        console.log(`Found ${packages.length} packages to seed...`);

        for (const pkg of packages) {
            // Ensure price is a number
            const price = parseFloat(pkg.price) || 0;

            // Handle image - if array, take first, else string
            let image = pkg.image;
            if (Array.isArray(image)) {
                image = image.length > 0 ? image[0] : '';
            }

            // MySQL Query
            const query = `
                INSERT INTO packages (id, title, destination, price, duration, description, image, activities)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                destination = VALUES(destination),
                price = VALUES(price),
                duration = VALUES(duration),
                description = VALUES(description),
                image = VALUES(image)
            `;

            // activities is not present in db.json packages, so defaulting to empty array
            const activities = JSON.stringify([]);

            await pool.query(query, [
                pkg.id,
                pkg.title,
                pkg.destination,
                price,
                pkg.duration,
                pkg.description,
                image,
                activities
            ]);
        }

        console.log('Packages seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding packages:', error);
        process.exit(1);
    }
}

seedPackages();
