/* ═══════════════════════════════════════════════════════════
   ПРОФИЛЬ
═══════════════════════════════════════════════════════════ */

const profilePage = {
  _bookings: [],
  _payments: [],
  _client:   null,
  _subActive: false,

  async render() {
    const u = Auth.get();
    if (u?.role && u.role !== 'Client') {
      return profilePage._renderStaff();
    }

    const name    = u?.clientName || u?.login || '';
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('page-content').innerHTML =
      /* ── Шапка ── */
      '<div class="profile-hd">' +
      '<div class="profile-avatar">' + esc(initial) + '</div>' +
      '<div class="profile-hd__info">' +
      '<h2 class="profile-name">' + esc(name) + '</h2>' +
      '<p class="profile-meta">' + esc(u?.login || '') + '</p>' +
      '</div>' +
      '<button class="btn btn--ghost btn--sm" onclick="profilePage.openEdit()">Редактировать</button>' +
      '</div>' +
      /* ── Личные данные ── */
      '<div class="info-card" id="pf-info-card">' +
      '<div class="info-card__title">Личные данные</div>' +
      '<div class="info-grid" id="pf-info-grid"><div class="ht-loading" style="padding:16px 0">Загрузка…</div></div>' +
      '</div>' +
      /* ── Статистика ── */
      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-card__icon">⏳</div>' +
      '<div class="stat-card__value" id="pf-pending">…</div>' +
      '<div class="stat-card__label">Ожидают подтверждения</div></div>' +
      '<div class="stat-card"><div class="stat-card__icon">✅</div>' +
      '<div class="stat-card__value" id="pf-active">…</div>' +
      '<div class="stat-card__label">Активных бронирований</div></div>' +
      '</div>' +
      /* ── Абонемент ── */
      '<div id="pf-sub-block" style="margin-bottom:28px"></div>' +
      /* ── Бронирования ── */
      '<div class="page-hd" style="margin-bottom:16px">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--dark)">Мои бронирования</h3>' +
      '</div>' +
      '<div class="toolbar">' +
      '<input class="search-input" type="text" id="pf-search" placeholder="🔍 Поиск по месту...">' +
      '<select class="form-select" id="pf-filter" style="max-width:200px">' +
      '<option value="">Все статусы</option>' +
      '<option value="PendingConfirmation">Ожидает</option>' +
      '<option value="Active">Активно</option>' +
      '<option value="Completed">Завершено</option>' +
      '<option value="Cancelled">Отменено</option></select>' +
      '</div>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>#</th><th>Место</th><th>Начало</th><th>Конец</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr></thead>' +
      '<tbody id="pf-tbody"></tbody></table></div>';

    document.getElementById('pf-search').addEventListener('input',  () => profilePage._applyFilters());
    document.getElementById('pf-filter').addEventListener('change', () => profilePage._applyFilters());

    profilePage._loadClientInfo();
    profilePage._loadSubscription();
    await profilePage._load();
  },

  /* ── Личные данные ── */

  async _loadClientInfo() {
    const u  = Auth.get();
    const el = document.getElementById('pf-info-grid');
    if (!el) return;

    let clientId = u?.clientId;
    if (!clientId && u?.id) {
      try {
        const ud = await apiUser.getById(u.id);
        clientId = ud?.id_client || ud?.clientId || null;
        if (clientId) {
          const stored = Auth.get();
          stored.clientId = clientId;
          localStorage.setItem('kw_user', JSON.stringify(stored));
        }
      } catch {}
    }

    if (!clientId) {
      const rows =
        (u?.email ? '<div class="info-row"><span class="info-label">Email</span><span class="info-value">' + esc(u.email) + '</span></div>' : '') +
        (u?.phone ? '<div class="info-row"><span class="info-label">Телефон</span><span class="info-value">' + esc(u.phone) + '</span></div>' : '');
      el.innerHTML = rows || '<p style="color:var(--muted);font-size:.9rem">Нет данных клиента</p>';
      return;
    }

    try {
      const c = await apiClient.getById(clientId);
      profilePage._client = c;
      el.innerHTML =
        '<div class="info-row"><span class="info-label">Имя</span><span class="info-value">'      + esc(c.name    || '—') + '</span></div>' +
        '<div class="info-row"><span class="info-label">Фамилия</span><span class="info-value">'   + esc(c.surname || '—') + '</span></div>' +
        '<div class="info-row"><span class="info-label">Email</span><span class="info-value">'     + esc(c.email   || u?.email || '—') + '</span></div>' +
        '<div class="info-row"><span class="info-label">Телефон</span><span class="info-value">'   + esc(c.phone   || u?.phone || '—') + '</span></div>';
    } catch {
      const fallback =
        (u?.email ? '<div class="info-row"><span class="info-label">Email</span><span class="info-value">'   + esc(u.email) + '</span></div>' : '') +
        (u?.phone ? '<div class="info-row"><span class="info-label">Телефон</span><span class="info-value">' + esc(u.phone) + '</span></div>' : '');
      el.innerHTML = fallback || '<p style="color:var(--muted);font-size:.9rem">Не удалось загрузить данные</p>';
    }
  },

  openEdit() {
    const c = profilePage._client;
    buildModal('modal-pf-edit', 'Редактировать данные',
      '<div class="form-row">' +
      '<div class="form-group"><label class="form-label">Имя</label>' +
      '<input class="form-input" id="pfe-name" value="' + esc(c?.name || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Фамилия</label>' +
      '<input class="form-input" id="pfe-surname" value="' + esc(c?.surname || '') + '"></div></div>' +
      '<div class="form-group"><label class="form-label">Email</label>' +
      '<input class="form-input" type="email" id="pfe-email" value="' + esc(c?.email || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Телефон</label>' +
      '<input class="form-input" type="tel" id="pfe-phone" value="' + esc(c?.phone || '+7') + '">' +
      '<small style="color:var(--muted);font-size:.78rem">Формат: +7 и 10 цифр</small>' +
      '<div class="phone-err" style="display:none;color:#8a2222;font-size:.8rem;margin-top:2px">Можно вводить только цифры</div></div>' +
      '<div id="pfe-err" class="form-error" style="display:none"></div>',
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-pf-edit\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="profilePage.saveEdit()">Сохранить</button>');
    openModal('modal-pf-edit');
  },

  async saveEdit() {
    const u       = Auth.get();
    const name    = document.getElementById('pfe-name')?.value.trim();
    const surname = document.getElementById('pfe-surname')?.value.trim();
    const email   = document.getElementById('pfe-email')?.value.trim();
    const phone   = document.getElementById('pfe-phone')?.value.trim();
    const errEl   = document.getElementById('pfe-err');
    if (!name || !surname) { errEl.textContent = 'Введите имя и фамилию'; errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    try {
      await apiClient.update(u.clientId, { id: u.clientId, name, surname, email, phone });
      toastOk('Данные обновлены');
      closeModal('modal-pf-edit');
      profilePage._loadClientInfo();
    } catch(e) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  },

  /* ── Бронирования ── */

  async _load() {
    const tbody = document.getElementById('pf-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#aaa">Загрузка…</td></tr>';
    try {
      const u = Auth.get();
      const [bookingsData, paymentsData] = await Promise.all([
        u?.clientId ? apiBooking.byClient(u.clientId) : Promise.resolve([]),
        apiPayment.getAll(1, 500).catch(() => []),
      ]);
      profilePage._bookings = Array.isArray(bookingsData) ? bookingsData : [];
      profilePage._payments = Array.isArray(paymentsData) ? paymentsData : [];

      const pf = document.getElementById('pf-pending');
      const af = document.getElementById('pf-active');
      if (pf) pf.textContent = profilePage._bookings.filter(b => b.status === 'PendingConfirmation').length;
      if (af) af.textContent = profilePage._bookings.filter(b => b.status === 'Active').length;

      profilePage._applyFilters();
    } catch(e) { toastErr(e.message); }
  },

  _applyFilters() {
    const q  = (document.getElementById('pf-search')?.value || '').toLowerCase();
    const st =  document.getElementById('pf-filter')?.value || '';
    let list = profilePage._bookings;
    if (st) list = list.filter(b => b.status === st);
    if (q)  list = list.filter(b => (b.workPlace?.name || '').toLowerCase().includes(q));
    profilePage._renderTable(list);
  },

  _renderTable(list) {
    const tbody = document.getElementById('pf-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>📋</p><p>Бронирований нет</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = list.map(b => {
      const payment = profilePage._payments.find(p => p.id_booking === b.id_booking);

      /* Определяем — покрыто ли бронирование абонементом
         Признак: lastPrice === 0 И нет допов (или сумма = только допы) */
      const isCoveredBySub = profilePage._subActive && b.lastPrice === 0;

      let acts = '';
      if (b.status === 'PendingConfirmation') {
        acts += '<button class="btn btn--danger btn--sm" onclick="profilePage.cancel(' + b.id_booking + ')">Отменить</button>';
      }
      if (b.status === 'Active') {
        if (isCoveredBySub) {
          /* Место покрыто абонементом */
          if (!payment || payment.status === 'Cancelled') {
            acts += '<span class="badge badge--green">🎟 По абонементу</span>';
          } else if (payment.status === 'Pending') {
            acts += '<span class="badge badge--yellow">⏳ Ожидает оплаты доп.</span>';
          } else if (payment.status === 'Paid') {
            acts += '<span class="badge badge--green">✓ Оплачено</span>';
          }
        } else {
          if (!payment || payment.status === 'Cancelled') {
            acts += '<span style="color:var(--muted);font-size:.8rem">Не оплачено</span>';
          } else if (payment.status === 'Pending') {
            acts += '<span class="badge badge--yellow">⏳ Ожидает</span>';
          } else if (payment.status === 'Paid') {
            acts += '<span class="badge badge--green">✓ Оплачено</span>';
          }
        }
      }
      if (!acts) acts = '<span style="color:#aaa;font-size:.8rem">—</span>';

      /* Сумма: если 0 и покрыто абонементом — показываем иначе */
      const sumHtml = isCoveredBySub && b.lastPrice === 0
        ? '<span style="color:#2d6a2d;font-size:.82rem;font-weight:600">🎟 0 ₽</span>'
        : fmtMoney(b.lastPrice || 0);

      return '<tr>' +
        '<td>#' + b.id_booking + '</td>' +
        '<td>' + esc(b.workPlace?.name || '—') + '</td>' +
        '<td>' + fmtDate(b.startDate) + '</td>' +
        '<td>' + fmtDate(b.endDate)   + '</td>' +
        '<td>' + sumHtml + '</td>' +
        '<td>' + badge(BOOK_STATUS, b.status) + '</td>' +
        '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' + acts + '</div></td></tr>';
    }).join('');
  },

  async cancel(id) {
    if (!confirm('Отменить бронирование #' + id + '?')) return;
    try { await apiBooking.cancel(id); toastOk('Бронирование отменено'); await profilePage._load(); }
    catch(e) { toastErr(e.message); }
  },

  /* ── Абонемент ── */

  async _loadSubscription() {
    const block = document.getElementById('pf-sub-block');
    if (!block) return;
    try {
      const sub = await apiSubscription.getMine().catch(() => null);
      profilePage._subActive = !!(sub && sub.status === 'Active');

      if (sub && sub.status === 'Active') {
        const until = sub.endDate
          ? new Date(sub.endDate.slice(0, 10) + 'T12:00:00')
              .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
          : '—';
        block.innerHTML =
          '<div class="sub-card sub-card--active"><div class="sub-card__icon">⭐</div>' +
          '<div><div class="sub-card__title">Абонемент активен</div>' +
          '<div class="sub-card__desc">Действует до ' + until + ' — все пространства бесплатно</div></div></div>';
      } else if (sub && sub.status === 'Pending') {
        block.innerHTML =
          '<div class="sub-card sub-card--pending"><div class="sub-card__icon">⏳</div>' +
          '<div><div class="sub-card__title">Абонемент ожидает активации</div>' +
          '<div class="sub-card__desc">Ожидайте подтверждения от кассира</div></div></div>';
      } else {
        block.innerHTML =
          '<div class="sub-card sub-card--none"><div class="sub-card__icon">🎟</div>' +
          '<div><div class="sub-card__title">Абонемент на месяц — 5 000 ₽</div>' +
          '<div class="sub-card__desc">Неограниченное бронирование любых пространств в течение месяца</div></div>' +
          '<button class="btn btn--accent btn--sm" onclick="profilePage.buySubscription()">Купить абонемент</button></div>';
      }
    } catch { block.innerHTML = ''; }
  },

  async buySubscription() {
    if (!confirm('Оформить заявку на абонемент за 5 000 ₽? После оплаты кассиру абонемент будет активирован.')) return;
    try {
      await apiSubscription.create({ price: 5000 });
      toastOk('Заявка отправлена — обратитесь к кассиру для оплаты');
      profilePage._loadSubscription();
    } catch(e) { toastErr(e.message); }
  },

  /* ── Профиль сотрудника ── */

  async _renderStaff() {
    const u         = Auth.get();
    const name      = u?.clientName || u?.login || '';
    const initial   = name.charAt(0).toUpperCase();
    const roleLabel = { Employee: 'Сотрудник', Cashier: 'Кассир', Administrator: 'Администратор', SuperAdmin: 'Суперадмин' }[u?.role] || u?.role || '';

    document.getElementById('page-content').innerHTML =
      '<div class="profile-hd">' +
      '<div class="profile-avatar">' + esc(initial) + '</div>' +
      '<div class="profile-hd__info">' +
      '<h2 class="profile-name">' + esc(name) + '</h2>' +
      '<p class="profile-meta">' + esc(roleLabel) + '</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="btn btn--ghost btn--sm" onclick="profilePage._editStaff()">Редактировать</button>' +
      '<button class="btn btn--ghost btn--sm" onclick="profilePage._changePassword()">Сменить пароль</button>' +
      '</div>' +
      '</div>' +
      '<div class="info-card">' +
      '<div class="info-card__title">Личные данные</div>' +
      '<div class="info-grid" id="staff-info-grid"><div class="ht-loading" style="padding:16px 0">Загрузка…</div></div>' +
      '</div>';

    profilePage._fillStaffGrid();
  },

  async _fillStaffGrid() {
    const u         = Auth.get();
    const roleLabel = { Employee: 'Сотрудник', Cashier: 'Кассир', Administrator: 'Администратор', SuperAdmin: 'Суперадмин' }[u?.role] || u?.role || '';
    let email = u?.email || null;
    let phone = u?.phone || null;

    if (u?.id) {
      try {
        const ud = await fetch(API_BASE + '/user/' + u.id, {
          headers: { 'Authorization': 'Bearer ' + Auth.token() }
        }).then(r => r.ok ? r.json() : null);
        if (ud) {
          email = ud.email || email;
          phone = ud.phone || phone;
          if (email || phone) {
            const stored = Auth.get();
            if (email) stored.email = email;
            if (phone) stored.phone = phone;
            localStorage.setItem('kw_user', JSON.stringify(stored));
          }
        }
      } catch {}
    }

    const grid = document.getElementById('staff-info-grid');
    if (!grid) return;
    grid.innerHTML =
      '<div class="info-row"><span class="info-label">Роль</span><span class="info-value">'     + esc(roleLabel)    + '</span></div>' +
      '<div class="info-row"><span class="info-label">Email</span><span class="info-value">'    + esc(email || '—') + '</span></div>' +
      '<div class="info-row"><span class="info-label">Телефон</span><span class="info-value">'  + esc(phone || '—') + '</span></div>';
  },

  _editStaff() {
    const u = Auth.get();
    buildModal('modal-staff-edit', 'Редактировать данные',
      '<div class="form-group"><label class="form-label">Email</label>' +
      '<input class="form-input" type="email" id="ste-email" value="' + esc(u?.email || '') + '" placeholder="example@mail.ru" autocomplete="email"></div>' +
      '<div class="form-group"><label class="form-label">Телефон</label>' +
      '<input class="form-input" type="tel" id="ste-phone" value="' + esc(u?.phone || '+7') + '" placeholder="+7XXXXXXXXXX">' +
      '<small style="color:var(--muted);font-size:.78rem">Формат: +7 и 10 цифр</small>' +
      '<div class="phone-err" style="display:none;color:#8a2222;font-size:.8rem;margin-top:2px">Можно вводить только цифры</div></div>' +
      '<div id="ste-err" class="form-error" style="display:none"></div>',
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-staff-edit\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="profilePage._saveStaffEdit()">Сохранить</button>');
    openModal('modal-staff-edit');
  },

  _saveStaffEdit() {
    const email = document.getElementById('ste-email')?.value.trim();
    const phone = document.getElementById('ste-phone')?.value.trim();
    const errEl = document.getElementById('ste-err');
    if (phone && phone !== '+7' && !/^\+7\d{10}$/.test(phone)) {
      errEl.textContent = 'Телефон должен быть в формате +7 и 10 цифр';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    const stored = Auth.get();
    stored.email = email || null;
    stored.phone = (phone && phone !== '+7') ? phone : null;
    localStorage.setItem('kw_user', JSON.stringify(stored));
    toastOk('Данные сохранены');
    closeModal('modal-staff-edit');
    profilePage._fillStaffGrid();
  },

  _changePassword() {
    buildModal('modal-chpass', 'Смена пароля',
      '<div class="form-group"><label class="form-label">Текущий логин</label>' +
      '<input class="form-input" id="chp-login" value="' + esc(Auth.get()?.login || '') + '" readonly></div>' +
      '<div class="form-group"><label class="form-label">Новый пароль</label>' +
      '<input class="form-input" type="password" id="chp-new" placeholder="Новый пароль" autocomplete="new-password"></div>' +
      '<div class="form-group"><label class="form-label">Повторите пароль</label>' +
      '<input class="form-input" type="password" id="chp-new2" placeholder="Повторите пароль" autocomplete="new-password"></div>' +
      '<div id="chp-err" class="form-error" style="display:none"></div>',
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-chpass\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="profilePage._savePassword()">Сохранить</button>');
    openModal('modal-chpass');
  },

  async _savePassword() {
    const login = document.getElementById('chp-login')?.value.trim();
    const pass  = document.getElementById('chp-new')?.value;
    const pass2 = document.getElementById('chp-new2')?.value;
    const errEl = document.getElementById('chp-err');
    if (!pass)          { errEl.textContent = 'Введите новый пароль';  errEl.style.display = 'block'; return; }
    if (pass !== pass2) { errEl.textContent = 'Пароли не совпадают';   errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    try {
      await apiAuth.resetPassword({ login, newPassword: pass });
      toastOk('Пароль изменён');
      closeModal('modal-chpass');
    } catch(e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  },
};