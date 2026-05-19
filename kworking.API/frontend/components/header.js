// frontend/components/header.js
function renderHeader() {
    const headerHTML = `
        <header>
            <nav class="nav">
                <a href="index.html" class="logo">K<span>Working</span></a>
                <ul class="nav-links">
                    <li><a href="index.html">Главная</a></li>
                    <li><a href="catalog.html">Каталог</a></li>
                    <li><a href="booking.html">Бронирование</a></li>
                    <li><a href="my-bookings.html">Мои брони</a></li>
                    <li><a href="profile.html">Профиль</a></li>
                </ul>
                <div id="auth-container">
                    <!-- JS вставит кнопку -->
                </div>
            </nav>
        </header>
    `;

    // Вставляем header в начало body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    updateAuthButton();
}

function updateAuthButton() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (api.isAuthenticated()) {
        container.innerHTML = `
            <a href="profile.html" class="btn btn-primary">Профиль</a>
            <button onclick="handleLogout()" style="margin-left: 10px; background: transparent; border: 1px solid #f87171; color: #f87171; padding: 10px 18px; border-radius: 6px; cursor: pointer;">
                Выйти
            </button>
        `;
    } else {
        container.innerHTML = `
            <a href="auth/login.html" class="btn btn-primary">Войти</a>
        `;
    }
}

function handleLogout() {
    if (confirm('Выйти из аккаунта?')) {
        api.logout();
    }
}

// Автоматически рендерим header на всех страницах
document.addEventListener('DOMContentLoaded', renderHeader);