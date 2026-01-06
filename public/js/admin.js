import { getCurrentUser, logout } from './auth.js';
import { api } from './api.js';

// Debug: Remove await if getCurrentUser is sync, though await is fine.
const user = getCurrentUser();
console.log("Admin Page User Check:", user);

// Protect Route
if (!user) {
    alert("Not logged in. Redirecting to login.");
    window.location.href = 'login.html';
    // Throw error to stop execution
    throw new Error("Not logged in");
} else if (user.role !== 'admin') {
    alert(`Access Denied. Role is '${user.role}', expected 'admin'. Redirecting to Home.`);
    window.location.href = 'index.html';
    throw new Error("Access Denied");
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-info').textContent = `Logged in as: ${user.username}`;
    document.getElementById('logout-btn').onclick = async () => {
        await logout();
        window.location.href = 'index.html';
    };

    const tabs = ['packages', 'bookings', 'users'];
    tabs.forEach(tab => {
        const el = document.getElementById(`nav-${tab}`);
        if (el) {
            el.onclick = () => {
                tabs.forEach(t => {
                    const nav = document.getElementById(`nav-${t}`);
                    const sec = document.getElementById(`section-${t}`);
                    if (nav) nav.classList.remove('active');
                    if (sec) sec.classList.remove('active');
                });
                document.getElementById(`nav-${tab}`).classList.add('active');
                document.getElementById(`section-${tab}`).classList.add('active');
                refreshData(tab);
            };
        }
    });

    // Initial Load
    refreshData('packages');
    setupModals();
});

function refreshData(tab) {
    if (tab === 'packages') loadPackages();
    if (tab === 'bookings') loadBookings();
    if (tab === 'users') loadUsers();
}

async function loadPackages() {
    const list = document.getElementById('packages-list');
    if (!list) return;
    list.innerHTML = 'Loading...';
    try {
        const pkgs = await api.get('/packages');
        list.innerHTML = pkgs.map(p => `
            <div class="card" style="padding:0; overflow:hidden;">
                <div style="height:150px; background:url('${p.image}') center/cover;"></div>
                <div style="padding:1rem;">
                    <h3>${p.title}</h3>
                    <div style="display:flex; justify-content:space-between; margin:0.5rem 0; color:var(--text-muted); font-size:0.9rem;">
                        <span>${p.duration}</span>
                        <span style="font-weight:700; color:var(--primary-color);">$${p.price}</span>
                    </div>
                    <p style="font-size:0.8rem; color:#666;">${p.description ? p.description.substring(0, 50) + '...' : ''}</p>
                    <button onclick="deletePackage('${p.id}')" style="width:100%; padding:0.5rem; background:#FEE2E2; color:#DC2626; border:none; border-radius:4px; cursor:pointer; margin-top:0.5rem;">Delete</button>
                </div>
            </div>
        `).join('');
        window.deletePackage = deletePackage;
    } catch (e) {
        console.error("Load Packages Error:", e);
        list.innerHTML = `<div style="color:red">Error loading packages: ${e.message}</div>`;
    }
}

async function createPackage(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('pkg-title').value,
        destination: document.getElementById('pkg-dest').value,
        price: Number(document.getElementById('pkg-price').value),
        duration: document.getElementById('pkg-duration').value,
        image: document.getElementById('pkg-image').value,
        description: document.getElementById('pkg-desc').value,
        activities: document.getElementById('pkg-activities').value.split(',').map(s => s.trim())
    };
    try {
        await api.post('/packages', data);
        document.getElementById('pkg-modal').style.display = 'none';
        e.target.reset();
        loadPackages();
    } catch (err) {
        console.error(err);
        alert('Failed to create package: ' + err.message);
    }
}

async function deletePackage(id) {
    if (!confirm('Delete this package?')) return;
    try {
        await api.delete(`/packages/${id}`);
        loadPackages();
    } catch (e) { alert(e.message); }
}

async function loadBookings() {
    const tbody = document.getElementById('bookings-table');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
        const bookings = await api.get('/bookings');
        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No bookings found.</td></tr>';
            return;
        }
        tbody.innerHTML = bookings.map(b => `
            <tr style="border-bottom:1px solid #eee;">
                <td>${b.username}</td>
                <td>${b.packageTitle || 'Custom Request'}<br><small style="color:#666">${b.customNotes || ''}</small></td>
                <td>${new Date(b.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge status-${b.status}">${b.status}</span></td>
                <td>
                    ${b.status === 'pending' ? `
                        <button onclick="processBooking('${b.id}', 'approved')" style="margin-right:0.5rem; color:green; cursor:pointer; border:1px solid green; background:white; padding:2px 8px; border-radius:4px;">Approve</button>
                        <button onclick="processBooking('${b.id}', 'rejected')" style="color:red; cursor:pointer; border:1px solid red; background:white; padding:2px 8px; border-radius:4px;">Reject</button>
                    ` : `<small>${b.adminResponse || ''}</small>`}
                </td>
            </tr>
        `).join('');
        window.processBooking = processBooking;
    } catch (e) {
        console.error("Load Bookings Error:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${e.message}</td></tr>`;
    }
}

async function processBooking(id, status) {
    const response = prompt(`Enter response message for user (${status}):`, status === 'approved' ? 'Your trip is confirmed!' : 'Sorry, we cannot fulfill this request.');
    if (response === null) return;

    try {
        await api.put(`/bookings/${id}`, { status, adminResponse: response });
        loadBookings();
    } catch (e) { alert(e.message); }
}

async function loadUsers() {
    const tbody = document.getElementById('users-table');
    const btn = document.getElementById('create-admin-btn');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    try {
        const users = await api.get('/admin/users');
        const me = users.find(u => u.id === user.id);

        if (btn) {
            if (me && me.isSuperAdmin) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        }

        tbody.innerHTML = users.map(u => `
             <tr style="border-bottom:1px solid #eee;">
                <td>${u.username} ${u.isSuperAdmin ? '👑' : ''}</td>
                <td>${u.email || '-'}</td>
                <td>${u.role}</td>
                <td style="text-align:right;">
                    ${!u.isSuperAdmin ? `<button onclick="deleteUser('${u.id}')" style="color:red; border:none; background:none; cursor:pointer;">Bin</button>` : ''}
                </td>
            </tr>
        `).join('');
        window.deleteUser = deleteUser;
    } catch (e) {
        console.error("Load Users Error:", e);
        tbody.innerHTML = `<tr><td colspan="4" style="color:red">Error loading users: ${e.message}</td></tr>`;
    }
}

async function deleteUser(id) {
    if (!confirm('Delete user?')) return;
    try {
        await api.delete(`/admin/users/${id}`);
        loadUsers();
    } catch (e) { alert(e.message); }
}

function setupModals() {
    const pModal = document.getElementById('pkg-modal');
    if (pModal) {
        document.getElementById('create-pkg-btn').onclick = () => pModal.style.display = 'block';
        document.querySelector('.close-pkg').onclick = () => pModal.style.display = 'none';
        document.getElementById('pkg-form').onsubmit = createPackage;
    }

    const aModal = document.getElementById('admin-modal');
    if (aModal) {
        document.getElementById('create-admin-btn').onclick = () => aModal.style.display = 'block';
        document.querySelector('.close-admin').onclick = () => aModal.style.display = 'none';

        document.getElementById('new-admin-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                username: document.getElementById('new-admin-user').value,
                email: document.getElementById('new-admin-email').value,
                password: document.getElementById('new-admin-pass').value
            };
            try {
                await api.post('/admin/create-admin', data);
                aModal.style.display = 'none';
                e.target.reset();
                loadUsers();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        };
    }

    window.onclick = (e) => {
        if (pModal && e.target == pModal) pModal.style.display = 'none';
        if (aModal && e.target == aModal) aModal.style.display = 'none';
    };
}
