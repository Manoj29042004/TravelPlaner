import { getCurrentUser, logout } from './auth.js';
import { api } from './api.js';

async function initApp() {
    console.log('Initializing Premium Experience...');
    const user = await getCurrentUser();
    updateNavigation(user);
    await loadDynamicContent();
    await loadTrips();
}

function updateNavigation(user) {
    const navLinks = document.querySelector('.nav-links');
    if (user) {
        let html = `<span style="font-weight:700; color:var(--color-primary); margin-right: 1.5rem;">${user.username || user.email}</span>`;
        if (user.role === 'admin') {
            html += `<a href="admin.html" class="btn btn-secondary" style="margin-right: 10px;">Control Tower</a>`;
        } else {
            html += `<a href="dashboard.html" class="btn btn-primary" style="margin-right: 10px;">My Dashboard</a>`;
        }
        html += `<button id="logout-btn" class="btn btn-secondary" style="background:transparent; border:none; padding:0; text-decoration:underline;">Sign Out</button>`;
        navLinks.innerHTML = html;
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await logout();
            window.location.reload();
        });
    } else {
        navLinks.innerHTML = `
            <a href="login.html" class="btn" style="color:white; margin-right:2rem; font-weight:700;">Sign In</a>
            <a href="register.html" class="btn btn-primary" style="background:white; color:var(--color-primary); border:none;">Join for Free</a>
        `;
    }
}

async function loadDynamicContent() {
    try {
        const main = document.getElementById('main-content');
        if (!main) return;

        let content;
        try {
            content = await api.get('/admin/content');
        } catch (e) {
            content = {
                heroTitle: "Explore the World",
                heroSubtitle: "Plan your dream vacation today",
                heroImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
            };
        }

        main.innerHTML = '';

        // 1. Hero Section (Lonely Planet Style with Parallax)
        const heroSection = document.createElement('section');
        heroSection.className = 'hero';
        heroSection.style.backgroundImage = `url('${content.heroImage}')`;
        heroSection.innerHTML = `
            <div class="container" style="display:flex; align-items:center; height:100%;">
                <div class="hero-content">
                    <p style="text-transform: uppercase; letter-spacing: 0.3em; font-weight: 700; color: white; margin-bottom: 1rem; font-size: 0.9rem;">Start your journey</p>
                    <h1>${content.heroTitle}</h1>
                    <p>${content.heroSubtitle}</p>
                    <div style="display:flex; gap: 1rem;">
                        <a href="register.html" class="btn btn-pop" style="padding: 18px 40px; font-size: 1.1rem;">Establish Itinerary</a>
                    </div>
                </div>
            </div>
        `;
        main.appendChild(heroSection);

        // 2. Value Props
        const props = document.createElement('section');
        props.className = 'container';
        props.style.padding = '8rem 2rem';
        props.innerHTML = `
            <div class="grid-3" style="gap: 4rem;">
                <div>
                    <h3 style="font-size: 1.8rem; margin-bottom: 1.5rem;">Unrivalled Insight</h3>
                    <p style="color: var(--color-text-light); line-height: 1.8;">Our community of over 10,000 explorers provides real-time updates on destinations worldwide.</p>
                </div>
                <div>
                    <h3 style="font-size: 1.8rem; margin-bottom: 1.5rem;">Precision Planning</h3>
                    <p style="color: var(--color-text-light); line-height: 1.8;">Sophisticated tools to manage every detail of your journey, from logistics to local secrets.</p>
                </div>
                <div>
                    <h3 style="font-size: 1.8rem; margin-bottom: 1.5rem;">Global Connection</h3>
                    <p style="color: var(--color-text-light); line-height: 1.8;">Collaborate with fellow travelers in real-time, sharing itineraries and splitting memories.</p>
                </div>
            </div>
        `;
        main.appendChild(props);

        // 3. Featured Destinations
        const tripsContainer = document.createElement('div');
        tripsContainer.id = 'trips-container';
        tripsContainer.className = 'container';
        tripsContainer.style.paddingBottom = '10rem';
        tripsContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 4rem;">
                <div>
                    <p style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.2em; font-weight: 700; color: var(--color-primary); margin-bottom: 1rem;">Featured</p>
                    <h2 style="font-size: 3rem; margin:0;">Destination Spotlight</h2>
                </div>
                <a href="login.html" style="font-weight: 700; color: var(--color-primary); text-decoration: none;">Explore All →</a>
            </div>
            <div class="grid-3" id="featured-grid" style="column-gap: 2rem; row-gap: 4rem;">
                <!-- Filled by loadTrips -->
            </div>
        `;
        main.appendChild(tripsContainer);

    } catch (err) {
        console.error('Core Hydration Failed', err);
    }
}

async function loadTrips() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    const featured = [
        {
            title: "Kyoto, Japan",
            desc: "Immerse in the serene beauty of ancient temples and vibrant seasonal colors.",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Santorini, Greece",
            desc: "Iconic blue-domed churches and breathtaking sunsets over the Aegean Sea.",
            img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Cinque Terre, Italy",
            desc: "Vibrant coastal villages perched on rugged cliffs and historic hiking trails.",
            img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    grid.innerHTML = featured.map((t, index) => `
        <div class="card" style="animation-delay: ${index * 0.1}s; animation: fadeIn 0.8s ease forwards; opacity: 0;">
            <div class="card-image" style="background-image: url('${t.img}')"></div>
            <div class="card-content">
                <h3>${t.title}</h3>
                <p>${t.desc}</p>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initApp);

document.addEventListener('DOMContentLoaded', initApp);
