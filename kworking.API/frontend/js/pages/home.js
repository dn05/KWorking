
const homePage = {

  
    show(tab) {
        
        if (tab === 'workplaces' && Auth.isLoggedIn()) {
            App.showSection('workplaces');
            homePage._setActiveLink(null);
            return;
        }
        const pageId = { booking: 'page-booking', workplaces: 'page-workplaces-pub', services: 'page-services-pub' }[tab];
        if (!pageId) return;
        showContainer(pageId);
        homePage._setActiveLink(tab);
        if (tab === 'booking')    homePage._renderBooking();
        if (tab === 'workplaces') homePage._renderWorkplaces();
        if (tab === 'services')   homePage._renderServices();
    },

    _setActiveLink(tab) {
        document.querySelectorAll('.navbar__link[data-tab]').forEach(b => {
            b.classList.toggle('navbar__link--active', b.dataset.tab === tab);
        });
    },

    _wrap(id, title, innerHtml) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML =
            '<div class="pub-section"><div class="container">' +
            '<h2 class="section-title">' + esc(title) + '</h2>' +
            innerHtml +
            '</div></div>' +
            '<footer class="footer"><div class="container">' +
            '<span>© 2026 KWorking. Все права защищены.</span>' +
            '</div></footer>';
    },

    async _authFetch(path) {
        const token = localStorage.getItem('kw_token');
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch(API_BASE + path, { headers });
        if (res.status === 401) { const err = new Error('401'); err.status = 401; throw err; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    },

   
    _renderBooking() {
        const isClient = Auth.isLoggedIn() && Auth.get()?.role === 'Client';
        const cta = isClient
            ? '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
              '<button class="btn btn--accent" data-nav="workplaces">Забронировать место</button>' +
              '<button class="btn btn--ghost" data-nav="bookings">Мои бронирования</button>' +
              '</div>'
            : '<button class="btn btn--accent" data-nav="register">Зарегистрироваться бесплатно</button>';

        homePage._wrap('page-booking', 'Как забронировать',
            '<div class="ht-steps">' +
            '<div class="ht-step"><div class="ht-step__num">1</div>' +
            '<div><h3>Зарегистрируйтесь</h3>' +
            '<p>Создайте аккаунт за пару минут — нужен только логин и пароль</p></div></div>' +
            '<div class="ht-step"><div class="ht-step__num">2</div>' +
            '<div><h3>Выберите место и время</h3>' +
            '<p>Выберите подходящее рабочее место, удобный день и нужные часы — слоты обновляются в реальном времени</p></div></div>' +
            '<div class="ht-step"><div class="ht-step__num">3</div>' +
            '<div><h3>Приходите и работайте</h3>' +
            '<p>Ваше место будет готово. Оплата наличными или картой на стойке у кассира</p></div></div>' +
            '</div>' +
            '<div style="text-align:center;margin-top:40px">' + cta + '</div>'
        );
    },

    
    _wpData: [],

    async _renderWorkplaces() {
        const el = document.getElementById('page-workplaces-pub');
        if (!el) return;
        el.innerHTML =
            '<div class="pub-section"><div class="container">' +
            '<h2 class="section-title">Рабочие места</h2>' +
            '<div class="toolbar">' +
            '<input class="search-input" type="text" id="wpg-search" placeholder="🔍 Поиск...">' +
            '<select class="form-select" id="wpg-filter" style="max-width:180px">' +
            '<option value="">Все типы</option>' +
            '<option value="OpenSpace">Открытое пространство</option>' +
            '<option value="Room">Комнаты</option>' +
            '<option value="MeetingRoom">Переговорные</option>' +
            '</select></div>' +
            '<div id="wpg-content"><div class="ht-loading">Загрузка...</div></div>' +
            '</div></div>' +
            '<footer class="footer"><div class="container">' +
            '<span>© 2026 KWorking. Все права защищены.</span>' +
            '</div></footer>';

        document.getElementById('wpg-search').addEventListener('input',  () => homePage._applyWpFilters());
        document.getElementById('wpg-filter').addEventListener('change', () => homePage._applyWpFilters());

        try {
            const data = await homePage._authFetch('/workplace');
            homePage._wpData = Array.isArray(data) ? data : [];
            homePage._applyWpFilters();
        } catch {
            const wrap = document.getElementById('wpg-content');
            if (wrap) wrap.innerHTML = '<div class="ht-empty">Не удалось загрузить данные. Попробуйте позже.</div>';
        }
    },

    _applyWpFilters() {
        const q  = (document.getElementById('wpg-search')?.value || '').toLowerCase();
        const tp = document.getElementById('wpg-filter')?.value || '';
        let list = homePage._wpData;
        if (tp) list = list.filter(w => w.type === tp);
        if (q)  list = list.filter(w =>
            (w.name||'').toLowerCase().includes(q) ||
            (w.type||'').toLowerCase().includes(q));
        homePage._renderWpCards(list);
    },

    _renderWpCards(list) {
        const wrap = document.getElementById('wpg-content');
        if (!wrap) return;
        if (!list.length) {
            wrap.innerHTML = '<div class="empty-state"><p>🏢</p><p>Рабочих мест не найдено</p></div>';
            return;
        }
        const order = ['OpenSpace', 'Room', 'MeetingRoom'];
        let html = '';
        order.forEach(type => {
            const group = list.filter(w => w.type === type);
            if (!group.length) return;
            const meta = WP_TYPES[type] || { label: type, icon: '🏢' };
            html +=
                '<div class="wp-section">' +
                '<div class="wp-section__hd">' +
                '<span class="wp-section__icon">' + meta.icon + '</span>' +
                '<h3 class="wp-section__title">' + meta.label + '</h3>' +
                '<span class="wp-section__count">' + group.length + '</span>' +
                '</div>' +
                '<div class="cards-grid">' +
                group.map(w => homePage._wpCardHtml(w)).join('') +
                '</div></div>';
        });
        const untyped = list.filter(w => !order.includes(w.type));
        if (untyped.length) {
            html += '<div class="wp-section"><div class="wp-section__hd">' +
                '<span class="wp-section__icon">📌</span>' +
                '<h3 class="wp-section__title">Прочие</h3></div>' +
                '<div class="cards-grid">' +
                untyped.map(w => homePage._wpCardHtml(w)).join('') +
                '</div></div>';
        }
        wrap.innerHTML = html;
    },

        _wpCardHtml(w) {
        const price = w.pricePerHour ? fmtMoney(w.pricePerHour) + '/ч' : '';
        const cls = w.status === 'free' ? 'wp-card--free' : w.status === 'busy' ? 'wp-card--busy' : 'wp-card--booked';

        
        const baseUrl = 'http://127.0.0.1:5175';
        const photoHtml = w.photoUrl 
            ? `<img src="${baseUrl}${w.photoUrl}" 
                     style="width:100%; height:160px; object-fit:cover; border-radius:10px; margin-bottom:12px;" 
                     alt="${esc(w.name)}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : `<div class="photo-placeholder" style="height:160px; background:#f0e9dc; border-radius:10px; margin-bottom:12px; display:flex; align-items:center; justify-content:center; color:#aaa; font-size:2.5rem;">
                 📷
               </div>`;

        return '<div class="wp-card ' + cls + '">' +
            photoHtml +
            '<div class="wp-card__head">' +
            '<span class="wp-card__name">' + esc(w.name) + '</span>' +
            '</div>' +
            (price ? '<div class="wp-card__price">' + price + '</div>' : '') +
            '<div class="wp-card__meta">' +
            '<span class="wp-type-chip">' +
            esc((WP_TYPES[w.type]?.icon || '📌') + ' ' + (WP_TYPES[w.type]?.label || w.type || 'Рабочее место')) +
            '</span>' +
            (w.capacity ? '<span class="wp-cap-chip">· до ' + w.capacity + ' чел.</span>' : '') +
            '</div>' +
            (w.description ? '<div class="wp-card__desc">' + esc(w.description) + '</div>' : '') +
            '<div class="wp-card__acts">' +
            '<button class="btn btn--accent btn--sm" onclick="homePage._promptLogin()">Выбрать время</button>' +
            '</div>' +
            '</div>';
    },
    
    _promptLogin() {
        buildModal('modal-need-auth', 'Требуется авторизация',
            '<div style="text-align:center;padding:16px 0">' +
            '<div style="font-size:2.5rem;margin-bottom:12px">🔐</div>' +
            '<p>Чтобы забронировать рабочее место, необходимо войти в аккаунт</p>' +
            '</div>',
            '<button class="btn btn--ghost" data-nav="login" onclick="closeModal(\'modal-need-auth\')">Войти</button>' +
            '<button class="btn btn--accent" data-nav="register" onclick="closeModal(\'modal-need-auth\')">Зарегистрироваться</button>');
        openModal('modal-need-auth');
    },

    
    _saveSvcCache(data) {
        try { localStorage.setItem('kw_svc_cache', JSON.stringify(data)); } catch {}
    },
    _loadSvcCache() {
        try { return JSON.parse(localStorage.getItem('kw_svc_cache')) || []; } catch { return []; }
    },
    async _cacheSvcBackground() {
        try {
            const data = await homePage._authFetch('/service');
            if (Array.isArray(data) && data.length) homePage._saveSvcCache(data);
        } catch {}
    },

    
    _svcNoticeHtml(isLoggedIn) {
        return isLoggedIn
            ? '<div style="background:var(--light);border-left:4px solid var(--medium);border-radius:6px;' +
              'padding:14px 18px;margin-bottom:20px;font-size:.9rem;color:var(--text)">' +
              'ℹ️ Услугой можно воспользоваться при бронировании рабочего места.' +
              '</div>'
            : '<div style="background:var(--pale);border-left:4px solid var(--dark);border-radius:6px;' +
              'padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
              '<span style="flex:1;font-size:.9rem">ℹ️ Воспользоваться услугами можно только при наличии бронирования рабочего места.</span>' +
              '<div style="display:flex;gap:8px;flex-shrink:0">' +
              '<button class="btn btn--accent btn--sm" data-nav="login">Войти</button>' +
              '<button class="btn btn--ghost btn--sm" data-nav="register">Зарегистрироваться</button>' +
              '</div></div>';
    },

       
    _svcCardsHtml(data) {
        return '<div class="ht-grid">' + data.map(s =>
            '<div class="ht-card">' +
            '<div class="ht-card__icon">🛠</div>' +
            '<h3 class="ht-card__title">' + esc(s.name) + '</h3>' +
            (s.info || s.description ? '<p class="ht-card__desc">' + esc(s.info || s.description) + '</p>' : '') +
            '<div class="ht-card__meta">' +
            '<span class="ht-card__price">' + fmtMoney(s.price) + '</span>' +
            '<span class="badge badge--' + (s.pricingType === 'Hourly' ? 'blue' : 'gray') + '">' +
            (s.pricingType === 'Hourly' ? 'Почасовая' : 'Разовая') + '</span>' +
            '</div></div>'
        ).join('') + '</div>';
    },

    
    async _renderServices() {
        const isLoggedIn = Auth.isLoggedIn();
        homePage._wrap('page-services-pub', 'Услуги',
            homePage._svcNoticeHtml(isLoggedIn) +
            '<div id="svc-pub-content"><div class="ht-loading">Загрузка...</div></div>');
        const el = document.getElementById('svc-pub-content');
        try {
            const data = await homePage._authFetch('/service');
            if (!el) return;
            if (!data || !data.length) { el.innerHTML = '<div class="ht-empty">Услуги пока не добавлены</div>'; return; }
            homePage._saveSvcCache(data);
            el.innerHTML = homePage._svcCardsHtml(data);
        } catch(e) {
            if (!el) return;
            const cached = homePage._loadSvcCache();
            if (e.status === 401 && cached.length) {
                el.innerHTML = homePage._svcCardsHtml(cached);
            } else if (e.status === 401) {
                el.innerHTML =
                    '<div class="ht-empty">Войдите в аккаунт, чтобы увидеть список услуг<br><br>' +
                    '<button class="btn btn--accent" data-nav="login">Войти</button>' +
                    '</div>';
            } else {
                el.innerHTML = '<div class="ht-empty">Не удалось загрузить данные. Попробуйте позже.</div>';
            }
        }
    },

    
    async _loadHomepageServices() {
        const notice = document.getElementById('home-svc-notice');
        const grid   = document.getElementById('home-svc-grid');
        if (!notice || !grid) return;

        const isLoggedIn = Auth.isLoggedIn();
        notice.innerHTML = homePage._svcNoticeHtml(isLoggedIn);
        grid.innerHTML = '<div class="ht-loading">Загрузка…</div>';

        try {
            const data = await homePage._authFetch('/service');
            if (!data || !data.length) { grid.innerHTML = '<div class="ht-empty">Услуги скоро появятся</div>'; return; }
            homePage._saveSvcCache(data);
            grid.innerHTML = homePage._svcCardsHtml(data);
        } catch(e) {
            const cached = homePage._loadSvcCache();
            if (cached.length) {
                grid.innerHTML = homePage._svcCardsHtml(cached);
            } else if (e.status === 401) {
                grid.innerHTML =
                    '<div class="ht-empty" style="padding:24px 0">' +
                    'Зарегистрируйтесь или войдите, чтобы увидеть список услуг<br><br>' +
                    '<button class="btn btn--accent btn--sm" data-nav="register" style="margin-right:8px">Зарегистрироваться</button>' +
                    '<button class="btn btn--ghost btn--sm" data-nav="login">Войти</button>' +
                    '</div>';
            } else {
                grid.innerHTML = '<div class="ht-empty">Не удалось загрузить услуги. Попробуйте позже.</div>';
            }
        }
    },
};
