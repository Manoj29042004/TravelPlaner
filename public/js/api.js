import { getAuthToken } from './auth.js';

const API_BASE = 'http://localhost:3000/api';

async function getHeaders() {
    const token = await getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export const api = {
    async get(endpoint) {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_BASE}${endpoint}`, { headers });

            if (!response.ok) {
                const text = await response.text();
                if (response.status === 401 || text.includes('User not found')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error("Session expired. Please login again.");
                }
                throw new Error(text || response.statusText || "Request failed");
            }
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                // Check for auth errors
                if (response.status === 401 || text.includes('User not found')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error("Session expired. Please login again.");
                }
                throw new Error(text || response.statusText || "Request failed");
            }
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    async put(endpoint, data) {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                if (response.status === 401 || text.includes('User not found')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error("Session expired. Please login again.");
                }
                throw new Error(text || response.statusText || "Request failed");
            }
            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },

    async delete(endpoint) {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const text = await response.text();
                if (response.status === 401 || text.includes('User not found')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error("Session expired. Please login again.");
                }
                throw new Error(text || response.statusText || "Request failed");
            }
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};
