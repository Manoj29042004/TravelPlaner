import { api } from './api.js';
import { logout } from './auth.js';

window.logout = logout;

// State management for sliders
const sliders = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('packages-grid');
    const modal = document.getElementById('booking-modal');

    // Set up modal listeners
    setupModal(modal);

    // [NEW] Validate session on load
    const token = sessionStorage.getItem('token');
    if (token) {
        try {
            await api.get('/auth/me'); // Verify token is still good
        } catch (e) {
            console.warn('Invalid session, clearing storage');
            sessionStorage.clear();
        }
    }

    // Initialize Navbar State
    updateNavbar();

    // Initial Loading State
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="loading-spinner">Loading your next adventure...</div>
        </div>
    `;

    try {
        const packages = await api.get('/packages');

        if (!packages || packages.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3>No packages found</h3>
                    <p class="text-muted">We're curating new experiences. Check back soon!</p>
                </div>
            `;
            return;
        }

        // [NEW] SEARCH FILTER
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        let displayPackages = packages;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            displayPackages = packages.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.destination.toLowerCase().includes(lowerQuery) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
            );

            // Should also update UI title
            document.querySelector('h2').textContent = `Results for "${searchQuery}"`;
        }

        if (displayPackages.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3>No results found for "${searchQuery}"</h3>
                    <button class="btn btn-secondary" onclick="window.location.href='packages.html'">View All Destinations</button>
                </div>
            `;
            return;
        }

        renderPackages(grid, displayPackages);

    } catch (err) {
        console.error('Failed to load packages:', err);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--error);">
                <h3>Unable to load packages</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
});

function updateNavbar() {
    const token = sessionStorage.getItem('token');
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    if (token) {
        // Logged In
        authContainer.innerHTML = `
            <a href="dashboard.html" class="lp-nav-link" style="margin-right:1rem;">My Dashboard</a>
            <button id="logout-btn" class="lp-nav-link" style="background:none; border:none; cursor:pointer; font-family:inherit; font-size:inherit;">Log Out</button>
        `;
        document.getElementById('logout-btn').onclick = logout;
    } else {
        // Not Logged In
        authContainer.innerHTML = `
            <a href="login.html" class="lp-nav-link">Log In</a>
            <a href="register.html" class="btn-lp-primary" style="padding: 0.5rem 1.5rem; color:white; text-decoration:none;">Sign Up</a>
        `;
    }
}

import { createPackageCard } from './utils/ui.js';

function renderPackages(container, packages) {
    container.innerHTML = packages.map(pkg => createPackageCard(pkg)).join('');
}

function updateSliderUI(pkgId, activeIndex) {
    const card = document.getElementById(`pkg-${pkgId}`);
    if (!card) return;

    const slides = card.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
        slide.style.opacity = index === activeIndex ? '1' : '0';
    });
}

// Modal Logic
function setupModal(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    const form = document.getElementById('booking-form');

    // Open/Close handlers
    window.openBooking = (id, title) => {
        // AUTH CHECK: Ensure user is logged in before booking
        const token = sessionStorage.getItem('token');
        if (!token) {
            // Optional: Store the intended destination to redirect back after login
            // sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('booking-pkg-id').value = id;
        document.getElementById('modal-title-text').textContent = title || 'Custom Trip';

        // Reset specific fields if it's a new request
        if (!id) {
            document.getElementById('booking-notes').placeholder = "Tell us about your dream trip...";
        }

        modal.style.display = 'flex';
    };

    window.requestCustomTrip = () => {
        openBooking('', 'Custom Trip Request');
    };

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeBtn.onclick = closeModal;

    // Close on outside click
    window.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Form Submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const pkgId = document.getElementById('booking-pkg-id').value;
        const notes = document.getElementById('booking-notes').value;

        try {
            await api.post('/bookings', {
                packageId: pkgId,
                customNotes: notes
            });

            alert('Booking request received! We will contact you shortly.');
            closeModal();
        } catch (err) {
            alert('Error submitting booking: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };
}
