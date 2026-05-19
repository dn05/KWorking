// frontend/js/api.js
const API_BASE = 'https://localhost:7038/api';

const api = {
    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(url, options = {}) {
        try {
            const response = await fetch(API_BASE + url, {
                ...options,
                headers: { ...this.getHeaders(), ...options.headers },
                credentials: 'include'
            });

            if (response.status === 204) return null;

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || `Ошибка ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get: (url) => api.request(url, { method: 'GET' }),
    post: (url, data) => api.request(url, { method: 'POST', body: JSON.stringify(data) }),

    // Auth
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'auth/login.html';
    },

    getWorkPlaces: () => api.get('/workplace'),
    getMyBookings: () => api.get('/booking/my'),
    createBooking: (data) => api.post('/booking', data),
};

window.api = api;