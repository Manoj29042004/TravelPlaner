import { api } from './api.js';

// Login using backend API (Local DB)
export async function login(username, password) {
    try {
        const response = await api.post('/auth/login', { username, password });

        const currentUser = {
            ...response.user,
            token: response.token
        };

        // Store user and token
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('token', response.token);
        return currentUser;
    } catch (error) {
        // Parse error message if possible
        let msg = error.message;
        try {
            if (msg.startsWith('{')) {
                const json = JSON.parse(msg);
                if (json.error) msg = json.error;
                else if (json.message) msg = json.message;
            }
        } catch (e) { }

        if (!msg || msg === '{}') msg = "An unknown error occurred. Please try again.";
        throw new Error(msg);
    }
}

// Register using backend API
export async function register(email, password, username = '') {
    try {
        // The backend expects username and password. We'll use email as username if not provided or handle it.
        // The current register route takes username, password. 
        // We should send username separately.

        await api.post('/auth/register', {
            username: username || email.split('@')[0],
            password,
            email
        });

        return { message: "Account created successfully" };
    } catch (error) {
        let msg = error.message;
        try {
            const json = JSON.parse(error.message);
            if (json.error) msg = json.error;
        } catch (e) { }
        throw new Error(msg);
    }
}

export async function logout() {
    try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error", error);
    }
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Token helper for backend verification
export async function getAuthToken() {
    return localStorage.getItem('token');
}
