import { getCurrentUser, logout } from './auth.js';
import { api } from './api.js';

const user = await getCurrentUser();
if (!user) window.location.href = 'login.html';

const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get('id');

if (!tripId) {
    window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // invite logic
    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', async () => {
            const username = prompt('Enter username to invite:');
            if (!username) return;
            try {
                await api.post(`/trips/${tripId}/collaborators`, { username });
                alert(`${username} has been invited!`);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Itinerary Modal Logic
    const itinModal = document.getElementById('itinerary-modal');
    const addDayBtn = document.getElementById('add-day-btn');
    const closeItin = document.querySelector('.close-itinerary');

    if (addDayBtn) addDayBtn.onclick = () => itinModal.style.display = "block";
    if (closeItin) closeItin.onclick = () => itinModal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == itinModal) itinModal.style.display = "none";
    }

    // Add Itinerary Item
    document.getElementById('itinerary-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const day = document.getElementById('itin-day').value;
        const title = document.getElementById('itin-title').value;
        const notes = document.getElementById('itin-notes').value;

        try {
            const trip = await api.get(`/trips/${tripId}`);
            const currentItinerary = trip.itinerary || [];
            const newItem = { day, title, notes };

            const updatedItinerary = [...currentItinerary, newItem];
            await api.put(`/trips/${tripId}`, { itinerary: updatedItinerary });

            itinModal.style.display = "none";
            e.target.reset();
            renderItinerary(updatedItinerary);
        } catch (error) {
            alert('Failed to add plan: ' + error.message);
        }
    });

    // Checklist Input Enter Key
    document.getElementById('new-item-text').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
    document.getElementById('add-item-btn').addEventListener('click', addItem);

    // Initial Load
    loadTripDetails();
});

async function loadTripDetails() {
    try {
        const trip = await api.get(`/trips/${tripId}`);

        // Update DOM elements
        document.getElementById('trip-title').textContent = trip.title;
        document.getElementById('trip-dates').textContent = trip.dates;
        document.getElementById('trip-desc').textContent = trip.description || 'No description provided.';

        // Update Hero Background
        const hero = document.querySelector('.trip-hero');
        if (hero && trip.image) {
            hero.style.backgroundImage = `url('${trip.image}')`;
        }

        // Show Content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('trip-content').style.display = 'block';

        loadChecklist();
        renderItinerary(trip.itinerary || []);
    } catch (error) {
        console.error(error);
        alert('Could not load trip details.');
        window.location.href = 'dashboard.html';
    }
}

function renderItinerary(itinerary) {
    const container = document.getElementById('itinerary-timeline');
    if (!container) return;

    if (!itinerary || itinerary.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 3rem; background: #F9FAFB; border-radius: var(--radius-md); border: 2px dashed #E5E7EB;">
                <p style="color:var(--text-muted); margin-bottom:1rem;">Your itinerary is empty.</p>
                <button onclick="document.getElementById('itinerary-modal').style.display='block'" class="btn btn-primary" style="font-size:0.9rem;">Start Planning</button>
            </div>`;
        return;
    }

    container.innerHTML = itinerary.map((item) => `
        <div class="timeline-item">
            <div class="timeline-date">${item.day}</div>
            <div class="card" style="padding: 1.5rem; margin-bottom:0;">
                <h4 style="margin-bottom:0.5rem; font-size: 1.1rem;">${item.title}</h4>
                <p style="color:var(--text-muted); font-size: 0.95rem;">${item.notes || ''}</p>
            </div>
        </div>
    `).join('');
}

async function loadChecklist() {
    try {
        const items = await api.get(`/checklists/${tripId}`);
        const container = document.getElementById('checklist-container');

        if (items.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-light); font-size:0.9rem; padding:1rem;">Empty list.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="checklist-item ${item.isComplete ? 'completed' : ''}">
                <input type="checkbox" ${item.isComplete ? 'checked' : ''} onchange="toggleItem('${item.id}', ${!item.isComplete})" style="width:18px; height:18px; cursor:pointer;">
                <span style="flex:1;">${item.text}</span>
                <button onclick="deleteItem('${item.id}')" style="background:none; border:none; color: #EF4444; opacity:0.5; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
        `).join('');

        // Expose to window for inline onclicks
        window.toggleItem = toggleItem;
        window.deleteItem = deleteItem;
    } catch (error) {
        console.error('Checklist Load Error:', error);
    }
}

async function addItem() {
    const input = document.getElementById('new-item-text');
    const text = input.value.trim();
    if (!text) return;

    try {
        await api.post(`/checklists/${tripId}`, { text });
        input.value = '';
        loadChecklist();
    } catch (error) {
        alert('Failed to add item');
    }
}

async function toggleItem(id, isComplete) {
    try {
        await api.put(`/checklists/${id}`, { isComplete });
        loadChecklist();
    } catch (error) {
        console.error(error);
    }
}

async function deleteItem(id) {
    if (confirm('Delete this item?')) {
        try {
            await api.delete(`/checklists/${id}`);
            loadChecklist();
        } catch (error) {
            alert('Failed to delete item');
        }
    }
}

// Live sync
setInterval(() => {
    if (!document.hidden && document.getElementById('trip-content').style.display === 'block') {
        loadChecklist();
    }
}, 5000);
