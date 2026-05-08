// ── НАСТРОЙКИ ──
// Измени порт на тот что показывает твой dotnet run
const API_BASE = 'http://localhost:5175/api';

// ── БАЗОВЫЙ ЗАПРОС ──
async function request(path, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_BASE + path, options);

    if (response.status === 204) return null; // No Content

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Ошибка ${response.status}`);
    }

    return response.json();
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════

const Auth = {
    // POST /api/auth/login
    login(login, password) {
        return request('/auth/login', 'POST', { login, password });
    }
};

// ════════════════════════════════════════
// CLIENTS
// ════════════════════════════════════════

const Clients = {
    // GET /api/client
    getAll() {
        return request('/client');
    },

    // GET /api/client/:id
    getById(id) {
        return request(`/client/${id}`);
    },

    // GET /api/client/search?name=&email=&phone=
    search({ name, email, phone } = {}) {
        const params = new URLSearchParams();
        if (name)  params.append('name', name);
        if (email) params.append('email', email);
        if (phone) params.append('phone', phone);
        return request(`/client/search?${params}`);
    },

    // POST /api/client
    create(client) {
        return request('/client', 'POST', client);
    },

    // PUT /api/client/:id
    update(id, client) {
        return request(`/client/${id}`, 'PUT', { ...client, id });
    },

    // DELETE /api/client/:id
    delete(id) {
        return request(`/client/${id}`, 'DELETE');
    }
};

// ════════════════════════════════════════
// WORKPLACES
// ════════════════════════════════════════

const WorkPlaces = {
    // GET /api/workplace
    getAll() {
        return request('/workplace');
    },

    // GET /api/workplace/:id
    getById(id) {
        return request(`/workplace/${id}`);
    },

    // GET /api/workplace/free
    getFree() {
        return request('/workplace/free');
    },

    // POST /api/workplace
    create(wp) {
        return request('/workplace', 'POST', wp);
    },

    // PUT /api/workplace/:id
    update(id, wp) {
        return request(`/workplace/${id}`, 'PUT', { ...wp, id_workplace: id });
    },

    // PATCH /api/workplace/:id/status?status=
    updateStatus(id, status) {
        return request(`/workplace/${id}/status?status=${status}`, 'PATCH');
    },

    // DELETE /api/workplace/:id
    delete(id) {
        return request(`/workplace/${id}`, 'DELETE');
    }
};

// ════════════════════════════════════════
// TARIFFS
// ════════════════════════════════════════

const Tariffs = {
    // GET /api/tariff
    getAll() {
        return request('/tariff');
    },

    // GET /api/tariff/:id
    getById(id) {
        return request(`/tariff/${id}`);
    },

    // POST /api/tariff
    create(tariff) {
        return request('/tariff', 'POST', tariff);
    },

    // PUT /api/tariff/:id
    update(id, tariff) {
        return request(`/tariff/${id}`, 'PUT', { ...tariff, id_tariff: id });
    },

    // DELETE /api/tariff/:id
    delete(id) {
        return request(`/tariff/${id}`, 'DELETE');
    }
};

// ════════════════════════════════════════
// BOOKINGS
// ════════════════════════════════════════

const Bookings = {
    // GET /api/booking
    getAll() {
        return request('/booking');
    },

    // GET /api/booking/:id
    getById(id) {
        return request(`/booking/${id}`);
    },

    // GET /api/booking/active
    getActive() {
        return request('/booking/active');
    },

    // GET /api/booking/client/:clientId
    getByClient(clientId) {
        return request(`/booking/client/${clientId}`);
    },

    // GET /api/booking/workplace/:workplaceId
    getByWorkPlace(workplaceId) {
        return request(`/booking/workplace/${workplaceId}`);
    },

    // GET /api/booking/search?startDate=&endDate=&status=
    search({ startDate, endDate, status } = {}) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate)   params.append('endDate', endDate);
        if (status)    params.append('status', status);
        return request(`/booking/search?${params}`);
    },

    // POST /api/booking
    create(booking) {
        return request('/booking', 'POST', booking);
    },

    // PUT /api/booking/:id
    update(id, booking) {
        return request(`/booking/${id}`, 'PUT', { ...booking, id_booking: id });
    },

    // PATCH /api/booking/:id/cancel
    cancel(id) {
        return request(`/booking/${id}/cancel`, 'PATCH');
    },

    // PATCH /api/booking/:id/complete
    complete(id) {
        return request(`/booking/${id}/complete`, 'PATCH');
    }
};

// ════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════

const Payments = {
    // GET /api/payment
    getAll() {
        return request('/payment');
    },

    // GET /api/payment/:id
    getById(id) {
        return request(`/payment/${id}`);
    },

    // GET /api/payment/booking/:bookingId
    getByBooking(bookingId) {
        return request(`/payment/booking/${bookingId}`);
    },

    // GET /api/payment/debt
    getDebts() {
        return request('/payment/debt');
    },

    // GET /api/payment/report?startDate=&endDate=
    getReport({ startDate, endDate } = {}) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate)   params.append('endDate', endDate);
        return request(`/payment/report?${params}`);
    },

    // POST /api/payment
    create(bookingId) {
        return request('/payment', 'POST', { id_booking: bookingId });
    },

    // PATCH /api/payment/:id/pay
    pay(id) {
        return request(`/payment/${id}/pay`, 'PATCH');
    },

    // PATCH /api/payment/:id/cancel
    cancel(id) {
        return request(`/payment/${id}/cancel`, 'PATCH');
    }
};

// ════════════════════════════════════════
// USERS
// ════════════════════════════════════════

const Users = {
    // GET /api/user
    getAll() {
        return request('/user');
    },

    // GET /api/user/:id
    getById(id) {
        return request(`/user/${id}`);
    },

    // GET /api/user/role/:role
    getByRole(role) {
        return request(`/user/role/${role}`);
    },

    // POST /api/user
    create(user) {
        return request('/user', 'POST', user);
    },

    // PUT /api/user/:id
    update(id, user) {
        return request(`/user/${id}`, 'PUT', { ...user, id_user: id });
    },

    // PATCH /api/user/:id/role?role=
    updateRole(id, role) {
        return request(`/user/${id}/role?role=${role}`, 'PATCH');
    },

    // DELETE /api/user/:id
    delete(id) {
        return request(`/user/${id}`, 'DELETE');
    }
};
