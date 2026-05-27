

const NAV_ITEMS = {
    Client:        [],
    Employee:      [{id:'dashboard',     label:'Главная'},
                    {id:'workplaces',    label:'Рабочие места'},
                    {id:'bookings',      label:'Бронирования'},
                    {id:'clients',       label:'Клиенты'},
                    {id:'profile',       label:'Профиль'}],
    Cashier:       [{id:'dashboard',     label:'Главная'},
                    {id:'bookings',      label:'Бронирования'},
                    {id:'payments',      label:'Платежи'},
                    {id:'subscriptions', label:'Абонементы'},
                    {id:'profile',       label:'Профиль'}],
    Administrator: [{id:'dashboard',     label:'Главная'},
                    {id:'workplaces',    label:'Рабочие места'},
                    {id:'bookings',      label:'Бронирования'},
                    {id:'services',      label:'Услуги'},
                    {id:'clients',       label:'Клиенты'},
                    {id:'users',         label:'Пользователи'},
                    {id:'payments',      label:'Платежи'},
                    {id:'subscriptions', label:'Абонементы'},
                    {id:'profile',       label:'Профиль'}],
    SuperAdmin:    [{id:'dashboard',     label:'Главная'},
                    {id:'workplaces',    label:'Рабочие места'},
                    {id:'bookings',      label:'Бронирования'},
                    {id:'services',      label:'Услуги'},
                    {id:'clients',       label:'Клиенты'},
                    {id:'users',         label:'Пользователи'},
                    {id:'payments',      label:'Платежи'},
                    {id:'subscriptions', label:'Абонементы'},
                    {id:'profile',       label:'Профиль'}],
};

const PAGE_RENDERERS = {
    dashboard:     () => dashboardPage.render(),
    profile:       () => profilePage.render(),
    workplaces:    () => workplacesPage.render(),
    bookings:      () => bookingsPage.render(),
    services:      () => servicesPage.render(),
    subscriptions: () => subscriptionsPage.render(),
    clients:       () => clientsPage.render(),
    users:         () => usersPage.render(),
    payments:      () => paymentsPage.render(),
};


function showContainer(id) {
    ['page-home','page-login','page-register','app-shell',
     'page-booking','page-workplaces-pub','page-services-pub'].forEach(cid => {
        const el = document.getElementById(cid);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}


function _renderHomeLinks() {
    const el = document.getElementById('navbar-links');
    if (!el) return;

    const isLoggedIn = Auth.isLoggedIn();
    

    if (!isLoggedIn) {
        el.innerHTML = `
            <a class="navbar__link" data-tab="booking" onclick="homePage.show('booking')">Бронирование</a>
            <a class="navbar__link" data-tab="workplaces" onclick="homePage.show('workplaces')">Рабочие места</a>
            <a class="navbar__link" data-tab="services" onclick="homePage.show('services')">Услуги</a>
        `;
    } else {

        el.innerHTML = `
            <a class="navbar__link" data-tab="workplaces" onclick="homePage.show('workplaces')">Рабочие места</a>
            <a class="navbar__link" data-tab="services" onclick="homePage.show('services')">Услуги</a>
        `;
    }
}

function _clearNavLinks() {
    const el = document.getElementById('navbar-links');
    if (el) el.innerHTML = '';
}

function renderNavGuest() {
    _renderHomeLinks();
    document.getElementById('navbar-right').innerHTML =
        '<button class="btn btn--ghost-light btn--sm" data-nav="login">Войти</button>' +
        '<button class="btn btn--accent btn--sm" data-nav="register">Зарегистрироваться</button>';
}

function renderNavAuth() {
    const u = Auth.get();
    const name = u?.clientName || u?.login || '';

    if (u?.role === 'Client') {
        _renderHomeLinks(); // теперь для клиента тоже вызовется
    } else {
        _clearNavLinks();
    }

    document.getElementById('navbar-right').innerHTML = `
        <span class="navbar__user">${esc(name)}</span>
        <button class="btn btn--ghost-light btn--sm" id="btn-profile">Профиль</button>
        <button class="btn btn--ghost-light btn--sm" id="btn-logout">Выйти</button>
    `;

    document.getElementById('btn-profile')?.addEventListener('click', () => App.showSection('profile'));
    document.getElementById('btn-logout').addEventListener('click', App.logout);
}


function renderSidebar(active) {
    const u     = Auth.get();
    const items = NAV_ITEMS[u?.role] || [];
    const shell = document.getElementById('app-shell');


    if (shell) shell.classList.toggle('app-shell--no-sidebar', !items.length);

    document.getElementById('sidebar-nav').innerHTML = items.map(it =>
        '<a class="sidebar__item' + (it.id === active ? ' sidebar__item--active' : '') +
        '" data-nav="' + it.id + '">' + esc(it.label) + '</a>'
    ).join('');

    const su = document.getElementById('sidebar-user');
    if (su) {
        su.innerHTML =
            '<div class="sidebar__user-name">' + esc(u?.clientName || u?.login || '') + '</div>';
    }
}


function renderSection(name) {
    const fn = PAGE_RENDERERS[name];
    if (fn) {
        try { fn(); } catch(e) { console.error('Ошибка рендера', name, e); }
    } else {
        dashboardPage.render();
    }
}


const App = {
    currentSection: null,

    navigate(page) {
        if (Auth.isLoggedIn()) {
            const role = Auth.get()?.role;

            if (page === 'home' && role === 'Client') {
                showContainer('page-home');
                homePage._setActiveLink(null);
                homePage._loadHomepageServices();
                return;
            }
            if (['home','login','register'].includes(page)) {
                App.showSection('dashboard'); return;
            }
            App.showSection(page);
        } else {
            if (['home','login','register'].includes(page)) {
                showContainer('page-' + page);
                if (page === 'home') homePage._loadHomepageServices();
                return;
            }
            showContainer('page-login');
        }
    },

    showSection(name) {
        showContainer('app-shell');
        homePage._setActiveLink(null);
        renderSidebar(name);
        renderSection(name);
        App.currentSection = name;
        location.hash = '/' + name;
    },

    afterLogin() {
        renderNavAuth();
        const role = Auth.get()?.role;
        homePage._cacheSvcBackground();
        if (role === 'Client') App._resolveClientId();
        App.showSection(role === 'Client' ? 'profile' : 'dashboard');
    },

    
    async _resolveClientId() {
        const u = Auth.get();
        if (!u?.id || u?.clientId) return;
        try {
            const ud = await fetch(API_BASE + '/user/' + u.id, {
                headers: { 'Authorization': 'Bearer ' + Auth.token() }
            }).then(r => r.ok ? r.json() : null);
            const clientId = ud?.id_client || ud?.clientId || ud?.client?.id || ud?.client?.id_client || null;
            if (clientId) {
                const stored = Auth.get();
                stored.clientId = clientId;
                localStorage.setItem('kw_user', JSON.stringify(stored));
            }
        } catch {}
    },

    logout() {
        Auth.clear();
        renderNavGuest(); 
        showContainer('page-home');
        homePage._loadHomepageServices();
        location.hash = '/home';
    },

    init() {
        
        document.addEventListener('click', e => {
            const el = e.target.closest('[data-nav]');
            if (el) { e.preventDefault(); App.navigate(el.dataset.nav); }
        });

        
        window.addEventListener('hashchange', () => {
            const page = location.hash.slice(2) || 'home';
            if (Auth.isLoggedIn() && !['home','login','register'].includes(page)) {
                App.showSection(page);
            }
        });

        
        initLoginForm();
        initRegisterForm();
        initForgotPassword();

       
        if (Auth.isLoggedIn()) {
            renderNavAuth();
            const hash = location.hash.slice(2);
            const role = Auth.get()?.role;
            const defaultSection = role === 'Client' ? 'profile' : 'dashboard';
            const section = (hash && !['home','login','register'].includes(hash)) ? hash : defaultSection;
            App.showSection(section);
        } else {
            renderNavGuest();
            showContainer('page-home');
            homePage._loadHomepageServices();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
