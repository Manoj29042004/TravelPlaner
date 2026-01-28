import { api } from './api.js';

// Helper to extract clean error message
function extractErrorMessage(error) {
    if (!error) return "An unknown error occurred.";
    let msg = error.message || error.toString();

    // Try to parse if it looks like JSON
    if (typeof msg === 'string' && msg.trim().startsWith('{')) {
        try {
            const json = JSON.parse(msg);
            if (json.error) return json.error;
            if (json.message) return json.message;
        } catch (e) { }
    }

    return msg;
}

// Login using backend API (Local DB)
export async function login(email, password) {
    try {
        const response = await api.post('/auth/login', { email, password });

        const currentUser = {
            ...response.user,
            token: response.token
        };

        // Store user and token
        sessionStorage.setItem('user', JSON.stringify(currentUser));
        sessionStorage.setItem('token', response.token);
        return currentUser;
    } catch (error) {
        console.error("Login Handler Error:", error);
        throw new Error(extractErrorMessage(error));
    }
}

// Register using backend API
export async function register(email, password, username = '') {
    try {
        await api.post('/auth/register', {
            username: username || email.split('@')[0],
            password,
            email
        });

        return { message: "Account created successfully" };
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}


export async function logout() {
    try {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error", error);
    }
}

export function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Token helper for backend verification
export async function getAuthToken() {
    return sessionStorage.getItem('token');
}
