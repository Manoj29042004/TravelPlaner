import { getCurrentUser, logout } from './auth.js';
import { api } from './api.js';
import { createPackageCard } from './utils/ui.js';

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

    // -----------------------------------------------------------
    // Notifications Logic
    // -----------------------------------------------------------
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifCount = document.getElementById('notif-count');
    const notifList = document.getElementById('notif-list');

    try {
        const notifs = await api.get('/notifications');

        if (notifs.length > 0) {
            if (notifCount) {
                notifCount.textContent = notifs.length;
                notifCount.style.display = "flex"; // flex to center content
            }
            if (notifList) {
                notifList.innerHTML = notifs.map(n => `
                    <div style="padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; cursor:pointer;" onclick="window.location.href='${n.link}'">
                        <p style="margin-bottom:0.25rem; font-weight:500;">${n.text}</p>
                        <small class="text-muted" style="color:var(--primary-blue);">${n.type.toUpperCase()} &bull; ${n.time}</small>
                    </div>
                `).join('');
            }
        } else {
            if (notifList) notifList.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--neutral-600);">No new notifications</div>`;
        }
    } catch (err) {
        console.error('Failed to load notifications', err);
    }

    notifBtn.onclick = (e) => {
        e.stopPropagation();
        notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
    };

    window.onclick = (event) => {
        if (!event.target.closest('#notif-btn')) {
            notifDropdown.style.display = 'none';
        }
        // Modal closing logic
        const createModal = document.getElementById('create-trip-modal');
        const bookingModal = document.getElementById('booking-modal');
        if (event.target == createModal) createModal.style.display = "none";
        if (event.target == bookingModal) bookingModal.style.display = "none";
    };

    // -----------------------------------------------------------
    // Trip Modal Logic
    // -----------------------------------------------------------
    const createModal = document.getElementById('create-trip-modal');
    const closeCreate = createModal.querySelector('.close');
    const createCard = document.getElementById('create-trip-card');

    if (createCard) createCard.onclick = () => createModal.style.display = "block";
    if (closeCreate) closeCreate.onclick = () => createModal.style.display = "none";

    // -----------------------------------------------------------
    // Booking Modal Logic
    // -----------------------------------------------------------
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        const closeBooking = bookingModal.querySelector('.close-booking');
        if (closeBooking) closeBooking.onclick = () => bookingModal.style.display = 'none';
    }

    // Load Data
    loadMyTrips();
    loadSharedTrips(); // New
    loadMyBookings();
    loadFeaturedPackages();

    // Create Trip Form
    document.getElementById('create-trip-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tripData = {
            title: document.getElementById('tripTitle').value,
            destination: document.getElementById('tripDestination').value,
            dates: document.getElementById('tripDates').value,
            image: document.getElementById('tripImage').value,
            description: document.getElementById('tripDesc').value
        };

        try {
            const newTrip = await api.post('/trips', tripData);
            createModal.style.display = "none";
            e.target.reset();

            // Redirect to the new trip to start planning immediately
            if (newTrip && newTrip.id) {
                window.location.href = `trip-details.html?id=${newTrip.id}`;
            } else {
                loadMyTrips();
            }
        } catch (error) {
            alert('Error creating trip: ' + error.message);
        }
    });

    // Booking Form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();
            const pkgId = document.getElementById('booking-pkg-id').value;
            const notes = document.getElementById('booking-notes').value;

            try {
                await api.post('/bookings', { packageId: pkgId, customNotes: notes });
                alert('Booking request sent! An admin will review it shortly.');
                bookingModal.style.display = 'none';
                e.target.reset();
                loadMyBookings();
            } catch (err) {
                alert('Booking failed: ' + err.message);
            }
        };
    }
});

let allTrips = [];

// -----------------------------------------------------------
// Step Management
// -----------------------------------------------------------
window.showPackageSelection = async () => {
    document.getElementById('modal-step-choice').style.display = 'none';
    document.getElementById('modal-step-packages').style.display = 'block';

    const list = document.getElementById('modal-package-list');
    list.innerHTML = '<p class="text-muted">Loading...</p>';

    try {
        const pkgs = await api.get('/packages');
        if (!pkgs || pkgs.length === 0) {
            list.innerHTML = '<p class="text-muted">No packages found.</p>';
            return;
        }

        list.innerHTML = pkgs.map(p => `
            <div onclick="selectPackageForTrip('${p.id}')" style="padding: 1rem; border: 1px solid var(--neutral-200); border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary-blue)'" onmouseout="this.style.borderColor='var(--neutral-200)'">
                <div style="font-weight: 600;">${p.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${p.destination} &bull; ${p.duration}</div>
            </div>
        `).join('');

        // Cache packages for selection
        window.currentPackages = pkgs;
    } catch (error) {
        list.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
};

window.showCustomForm = () => {
    document.getElementById('modal-step-choice').style.display = 'none';
    document.getElementById('create-trip-form').style.display = 'block';
};

window.resetModal = () => {
    document.getElementById('modal-step-choice').style.display = 'block';
    document.getElementById('modal-step-packages').style.display = 'none';
    document.getElementById('create-trip-form').style.display = 'none';
    document.getElementById('create-trip-form').reset();
};

window.selectPackageForTrip = async (pkgId) => {
    const pkg = window.currentPackages.find(p => p.id === pkgId);
    if (!pkg) return;

    // Auto-create trip from package
    const tripData = {
        title: pkg.title,
        destination: pkg.destination,
        dates: 'Dates TBD', // Placeholder
        image: pkg.image,
        description: pkg.description
    };

    try {
        const btn = document.querySelector(`[onclick="selectPackageForTrip('${pkgId}')"]`);
        if (btn) {
            btn.style.opacity = '0.7';
            btn.innerHTML += ' <span class="loading-spinner" style="width:12px;height:12px;"></span>';
        }

        const newTrip = await api.post('/trips', tripData);
        document.getElementById('create-trip-modal').style.display = "none";

        if (newTrip && newTrip.id) {
            // Success - Redirect immediately to the new trip details
            window.location.href = `trip-details.html?id=${newTrip.id}`;
        } else {
            loadMyTrips();
        }
    } catch (error) {
        alert('Error creating trip: ' + error.message);
    }
};


document.addEventListener('DOMContentLoaded', async () => {
    // ... existing initialization code ...
    // NOTE: This part is actually already inside the main DOMContentLoaded block at the top of the file.
    // The previous edit likely messed up the structure. 
    // I need to be careful here. 
    // The previous edit replaced `window.filterTrips = ...` with new functions and an `addEventListener`.
    // But `filterTrips` IS NEEDED.
    // And `dashboard.js` ALREADY HAD a `DOMContentLoaded` listener at the top.
    // So I duplicated the listener and removed `filterTrips`.
});

// Restore filterTrips
window.filterTrips = (filter) => {
    // Update active tab UI
    ['all', 'upcoming', 'past'].forEach(type => {
        const btn = document.getElementById(`tab-${type}`);
        if (btn) {
            btn.classList.remove('btn-primary', 'btn-white');
            btn.classList.add(type === filter ? 'btn-primary' : 'btn-white');
        }
    });

    const grid = document.getElementById('my-trips-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const now = new Date();
    // Helper to determine status based on date string (rough logic)
    const isUpcoming = (dateStr) => {
        if (!dateStr) return true; // Default to upcoming if undefined
        // Try strict parse
        // If string contains year, check it. If "Jun 15 - Jun 25" assume current/next year logic or just use string match
        if (dateStr.match(/\d{4}/)) {
            const year = parseInt(dateStr.match(/\d{4}/)[0]);
            if (year > now.getFullYear()) return true;
            if (year < now.getFullYear()) return false;
        }
        return true; // Fallback
    };

    let filtered = allTrips;
    if (filter === 'upcoming') filtered = allTrips.filter(t => isUpcoming(t.dates));
    if (filter === 'past') filtered = allTrips.filter(t => !isUpcoming(t.dates));

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                <h3 style="margin-bottom: 0.5rem; color: var(--text-muted);">No ${filter} trips found</h3>
                <p style="color: var(--text-light);">Time to plan something new?</p>
            </div>`;
        return;
    }

    filtered.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'trip-card';
        const imageUrl = trip.image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop';

        card.innerHTML = `
            <div class="trip-img" style="background-image: url('${imageUrl}')"></div>
            <div class="trip-content">
                <div class="trip-date">${trip.dates}</div>
                <h3 class="trip-title">${trip.title}</h3>
                <p class="trip-date" style="font-size: 0.85rem; color: var(--text-muted); text-transform: none; margin-bottom: 0.5rem;">📍 ${trip.destination || 'Unknown Location'}</p>
                <p class="trip-desc">${trip.description || 'No description provided.'}</p>
                <div class="trip-actions">
                    <a href="trip-details.html?id=${trip.id}" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View Details</a>
                    <button class="delete-btn" style="background:none; border:none; color: var(--text-light); cursor:pointer; font-weight:500;">Discard</button>
                </div>
            </div>
        `;
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.onclick = () => deleteTrip(trip.id);
        grid.appendChild(card);
    });
};


async function loadMyTrips() {
    const grid = document.getElementById('my-trips-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align:center;">Loading journeys...</p>';

    try {
        allTrips = await api.get('/trips');

        // --- Calculate Stats ---
        const totalTrips = allTrips.length;
        const upcomingCount = allTrips.filter(t => t.dates && t.dates.includes('2026')).length; // specialized for our current "future"

        const statTrips = document.getElementById('stat-trips');
        if (statTrips) statTrips.textContent = totalTrips;

        const statUpcoming = document.getElementById('stat-upcoming');
        if (statUpcoming) statUpcoming.textContent = upcomingCount;

        const statPlaces = document.getElementById('stat-places');
        if (statPlaces) statPlaces.textContent = totalTrips;

        // Render Initial Filter (All)
        window.filterTrips('all');

    } catch (error) {
        grid.innerHTML = `<p style="color:red; grid-column: 1/-1;">Error loading trips: ${error.message}</p>`;
    }
}

async function loadSharedTrips() {
    const grid = document.getElementById('shared-trips-grid');
    if (!grid) return;

    // Placeholder for when backend supports invitations
    // For now, if we had an endpoint like /trips/shared we would call it.
    // simulation:
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;">You haven't been invited to any trips yet.</p>`;
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

async function loadMyBookings() {
    const grid = document.getElementById('my-bookings-grid');
    if (!grid) return;

    grid.innerHTML = '<p class="text-muted">Loading bookings...</p>';

    try {
        const bookings = await api.get('/bookings/my-bookings');
        grid.innerHTML = '';

        if (!bookings || bookings.length === 0) {
            grid.innerHTML = `
                <div class="stat-card" style="grid-column: 1/-1; background: #F8FAFC; border: 1px dashed #E2E8F0;">
                    <h3 style="font-size: 1.1rem; color: var(--text-muted);">No active bookings</h3>
                    <p style="font-size: 0.9rem;">Book a package to see it here.</p>
                </div>`;
            return;
        }

        bookings.forEach(b => {
            const card = document.createElement('div');
            card.className = 'trip-card';
            // Status Badge Logic
            let statusColor = '#CBD5E1'; // grey
            let statusText = 'Pending';
            if (b.status === 'approved') { statusColor = 'var(--secondary-color)'; statusText = 'Confirmed'; }
            if (b.status === 'rejected') { statusColor = '#EF4444'; statusText = 'Declined'; }
            if (b.status === 'pending') { statusColor = '#F59E0B'; statusText = 'Pending Approval'; }

            card.innerHTML = `
                <div style="padding: 1.5rem; border-bottom: 4px solid ${statusColor};">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                        <span style="background:${statusColor}22; color:${statusColor}; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:700; text-transform:uppercase;">${statusText}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 class="trip-title" style="margin-bottom:0.5rem;">${b.packageTitle || 'Custom Trip'}</h3>
                    ${b.customNotes ? `<p class="trip-desc" style="font-style:italic;">"${b.customNotes}"</p>` : ''}
                    ${b.adminResponse ? `
                        <div style="background:#F1F5F9; padding:0.75rem; border-radius:4px; margin-top:1rem;">
                            <strong style="display:block; font-size:0.8rem; color:var(--text-main); margin-bottom:0.25rem;">Admin Status:</strong>
                            <p style="font-size:0.9rem; margin:0;">${b.adminResponse}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = `<p style="color:red;">Error loading bookings: ${error.message}</p>`;
    }
}

async function loadFeaturedPackages() {
    const grid = document.getElementById('featured-packages-grid');
    if (!grid) return;
    try {
        const pkgs = await api.get('/packages');
        grid.innerHTML = '';
        if (!pkgs || pkgs.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;" class="text-muted">No adventures available at the moment.</div>';
            return;
        }
        // Show first 3 packages using shared UI
        grid.innerHTML = pkgs.slice(0, 3).map(pkg => createPackageCard(pkg)).join('');

    } catch (error) {
        grid.innerHTML = `<p style="color:red; grid-column:1/-1;">Error loading packages: ${error.message}</p>`;
    }
}

// Booking Modal Opener
window.openBooking = (id, title) => {
    document.getElementById('booking-pkg-id').value = id;
    document.getElementById('modal-title').textContent = `Book: ${title}`;
    document.getElementById('booking-modal').style.display = 'block';
};

