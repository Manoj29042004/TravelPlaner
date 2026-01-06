import { getCurrentUser, logout } from './auth.js';
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info
    document.getElementById('user-name').textContent = user.username || 'Traveler';

    // Logout logic
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await logout();
    });

    // Modal logic
    const modal = document.getElementById('create-trip-modal');
    const closeBtn = document.querySelector('.close');
    const createCard = document.getElementById('create-trip-card');

    if (createCard) createCard.onclick = () => modal.style.display = "block";
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    // Load Trips
    loadMyTrips();

    // Create Trip Form
    document.getElementById('create-trip-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tripData = {
            title: document.getElementById('tripTitle').value,
            dates: document.getElementById('tripDates').value,
            image: document.getElementById('tripImage').value,
            description: document.getElementById('tripDesc').value
        };

        try {
            await api.post('/trips', tripData);
            modal.style.display = "none";
            e.target.reset();
            loadMyTrips();
        } catch (error) {
            alert('Error creating trip: ' + error.message);
        }
    });
});

async function loadMyTrips() {
    const grid = document.getElementById('my-trips-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align:center;">Loading journeys...</p>';

    try {
        const trips = await api.get('/trips');
        grid.innerHTML = '';

        const statTrips = document.getElementById('stat-trips');
        if (statTrips) statTrips.textContent = trips.length;

        if (trips.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                    <h3 style="margin-bottom: 0.5rem; color: var(--text-muted);">No trips found</h3>
                    <p style="color: var(--text-light);">Start by creating your first adventure above!</p>
                </div>`;
            return;
        }

        trips.forEach(trip => {
            const card = document.createElement('div');
            card.className = 'trip-card';

            const imageUrl = trip.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop';

            card.innerHTML = `
                <div class="trip-img" style="background-image: url('${imageUrl}')"></div>
                <div class="trip-content">
                    <div class="trip-date">${trip.dates}</div>
                    <h3 class="trip-title">${trip.title}</h3>
                    <p class="trip-desc">${trip.description || 'No description provided.'}</p>
                    <div class="trip-actions">
                        <a href="trip-details.html?id=${trip.id}" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View Details</a>
                        <button class="delete-btn" style="background:none; border:none; color: var(--text-light); cursor:pointer; font-weight:500;">Discard</button>
                    </div>
                </div>
            `;

            // Add event listener for delete button specifically
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.onclick = () => deleteTrip(trip.id);

            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = `<p style="color:red; grid-column: 1/-1;">Error loading trips: ${error.message}</p>`;
    }
}

async function deleteTrip(id) {
    if (confirm('Are you sure you want to discard this trip? This action cannot be undone.')) {
        try {
            await api.delete(`/trips/${id}`);
            loadMyTrips();
        } catch (error) {
            alert('Error deleting trip: ' + error.message);
        }
    }
}
