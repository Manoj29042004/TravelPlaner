const API_BASE = 'http://localhost:3000/api';

async function getAuthToken() {
    return sessionStorage.getItem('token');
}

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
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
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

                // Don't intercept 401 for auth routes (let logic handle it)
                if (!endpoint.includes('/auth/') && (response.status === 401 || text.includes('User not found'))) {
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error("Session expired. Please login again.");
                }

                // Parse error JSON if possible
                let errorMessage = text;
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.error || json.message || text;
                } catch (e) { }

                throw new Error(errorMessage || response.statusText || "Request failed");
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
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
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
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
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
