/**
 * main.js
 * Global scripts for Navbar, Search, and common interactions.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Search Trigger ---
    const navSearchBtn = document.getElementById('nav-search-trigger');
    const heroSearchInput = document.getElementById('hero-search-input');

    if (navSearchBtn) {
        navSearchBtn.addEventListener('click', () => {
            // If hero search exists (Home/Dash), focus it.
            if (heroSearchInput) {
                heroSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                heroSearchInput.focus();
            } else {
                // Else redirect to packages page which is the main search area
                window.location.href = 'packages.html';
            }
        });
    }

    // --- Hero Search Execution ---
    const heroSearchBtn = document.getElementById('hero-search-btn');

    if (heroSearchBtn && heroSearchInput) {
        // Function to handle search redirect
        const performSearch = () => {
            const query = heroSearchInput.value.trim();
            if (query) {
                // Redirect to packages page with search param
                window.location.href = `packages.html?search=${encodeURIComponent(query)}`;
            }
        };

        heroSearchBtn.addEventListener('click', performSearch);

        // Allow Enter key
        heroSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // --- Active Link Highlighting ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.lp-nav-link');

    navLinks.forEach(link => {
        // Simple check if href matches current page
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href) && href !== '#') {
            // link.style.color = 'var(--primary-blue)'; // Optional visual cue
        }
    });

});
