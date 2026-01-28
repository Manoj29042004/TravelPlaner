/**
 * Shared UI Utilities
 */

export function createPackageCard(pkg) {
    // Use first image if available, else fallback
    const image = (pkg.images && pkg.images.length > 0) ? pkg.images[0] : (pkg.image || 'https://via.placeholder.com/600x400');

    // Format price
    const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pkg.price);

    // Escape title for onclick safely
    const safeTitle = pkg.title.replace(/'/g, "\\'");

    return `
        <article class="card" id="pkg-${pkg.id}">
            <div class="card-img-container">
                <img src="${image}" alt="${pkg.title}" class="card-img">
            </div>
            
            <div class="card-body">
                <span class="card-kicker">${pkg.duration} / ${pkg.destination || 'Global'}</span>
                
                <h3 class="card-title">${pkg.title}</h3>
                
                <div class="card-footer">
                    <div class="card-price-block">
                        <span class="card-price-label">From</span>
                        <span class="card-price-value">${price}</span>
                    </div>
                    
                    <button class="btn-lp-primary" onclick="openBooking('${pkg.id}', '${safeTitle}')">
                        Book Now <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}
