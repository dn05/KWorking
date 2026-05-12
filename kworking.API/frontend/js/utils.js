// ════════════════════════════════════════
// ФОРМАТИРОВАНИЕ
// ════════════════════════════════════════

// Дата + время: 07.05.2026, 14:30
function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Только дата: 07.05.2026
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

// Деньги: 1 500,00 ₽
function formatMoney(amount) {
    return Number(amount).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';
}

// Полное имя клиента
function formatName(client) {
    if (!client) return '—';
    return `${client.name || ''} ${client.surname || ''}`.trim();
}

// ════════════════════════════════════════
// БЕЙДЖИ СТАТУСОВ
// ════════════════════════════════════════

function bookingBadge(status) {
    const map = {
        Active:    ['badge-green',  'Активно'],
        Completed: ['badge-gray',   'Завершено'],
        Cancelled: ['badge-red',    'Отменено']
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
}

function paymentBadge(status) {
    const map = {
        Pending:   ['badge-orange', 'Ожидает'],
        Paid:      ['badge-green',  'Оплачено'],
        Cancelled: ['badge-red',    'Отменено']
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
}

function workplaceBadge(status) {
    const map = {
        free:   ['badge-green',  'Свободно'],
        busy:   ['badge-red',    'Занято'],
        booked: ['badge-orange', 'Забронировано']
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
}

function userRoleBadge(role) {
    const map = {
        Admin:     ['badge-purple', 'Администратор'],
        Client:    ['badge-blue',   'Клиент'],
        Staff:     ['badge-gray',   'Сотрудник'],
        Cashier:   ['badge-orange', 'Кассир']
    };
    const [cls, label] = map[role] || ['badge-gray', role];
    return `<span class="badge ${cls}">${label}</span>`;
}

// ════════════════════════════════════════
// АВАТАР
// ════════════════════════════════════════

const AVATAR_COLORS = [
    ['#eff4ff', '#2563eb'],
    ['#f0fdf4', '#16a34a'],
    ['#f5f3ff', '#7c3aed'],
    ['#fffbeb', '#d97706'],
    ['#fef2f2', '#dc2626'],
    ['#f0fdfa', '#0d9488']
];

function avatar(name, surname) {
    const initials = `${(name || '?')[0]}${(surname || '')[0] || ''}`.toUpperCase();
    const idx = ((name || '?').charCodeAt(0) + ((surname || '').charCodeAt(0) || 0)) % AVATAR_COLORS.length;
    const [bg, color] = AVATAR_COLORS[idx];
    return `<div class="avatar" style="background:${bg};color:${color}">${initials}</div>`;
}

// ════════════════════════════════════════
// TOAST УВЕДОМЛЕНИЯ
// ════════════════════════════════════════

function toast(message, type = 'info') {
    const container = document.getElementById('toasts');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'i' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
    <span style="font-weight:700;font-size:13px">${icons[type] || 'i'}</span>
    <span>${message}</span>
  `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ════════════════════════════════════════
// МОДАЛЬНЫЕ ОКНА
// ════════════════════════════════════════

function openModal(id) {
    document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
}

// Закрыть модалку по клику на оверлей (не на само окно)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

// ════════════════════════════════════════
// СОСТОЯНИЯ ТАБЛИЦ
// ════════════════════════════════════════

// Показать спиннер загрузки в контейнере
function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Загрузка...
    </div>`;
}

// Показать сообщение об отсутствии данных
function showEmpty(containerId, icon, title, subtitle = '') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `
    <div class="empty">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      ${subtitle ? `<div class="empty-sub">${subtitle}</div>` : ''}
    </div>`;
}

// ════════════════════════════════════════
// ФОРМЫ
// ════════════════════════════════════════

// Получить значение поля по id
function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// Установить значение поля по id
function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
}

// Очистить несколько полей сразу
function clearFields(...ids) {
    ids.forEach(id => setVal(id, ''));
}

// Проверить что поля не пустые, подсветить пустые красным
function validateRequired(...ids) {
    let valid = true;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!el.value.trim()) {
            el.style.borderColor = 'var(--danger)';
            valid = false;
        } else {
            el.style.borderColor = '';
        }
    });
    return valid;
}

// ════════════════════════════════════════
// НАВИГАЦИЯ
// ════════════════════════════════════════

// Перейти на страницу
function goTo(page) {
    window.location.href = page;
}

// Получить параметр из URL: ?id=5 → getParam('id') → '5'
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// ════════════════════════════════════════
// СЕССИЯ
// ════════════════════════════════════════

// Сохранить данные пользователя после логина
function saveSession(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
}

// Получить текущего пользователя
function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
}

// Очистить сессию (выход)
function clearSession() {
    sessionStorage.removeItem('user');
}

// Проверить что пользователь залогинен, иначе редирект на index.html
function requireAuth() {
    const user = getSession();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
