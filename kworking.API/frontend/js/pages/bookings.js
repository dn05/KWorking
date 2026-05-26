/* ═══════════════════════════════════════════════════════════
   БРОНИРОВАНИЯ
═══════════════════════════════════════════════════════════ */

const bookingsPage = {
  _data:     [],
  _payments: [],
  _page:     1,

  async render() {
    const isAdmin  = Auth.isAdmin();
    const isStaff  = Auth.isStaff();
    const isClient = Auth.isClient();

    document.getElementById('page-content').innerHTML =
      '<div class="page-hd">' +
      '<h2>' + (isClient ? 'Мои бронирования' : 'Бронирования') + '</h2>' +
      (isAdmin ? '<button class="btn btn--accent btn--sm" onclick="bookingsPage.openCreate()">+ Создать</button>' : '') +
      '</div>' +
      '<div class="toolbar">' +
      '<input class="search-input" type="text" id="bk-search" placeholder="🔍 Поиск по имени / месту...">' +
      '<select class="form-select" id="bk-filter" style="max-width:200px">' +
      '<option value="">Все статусы</option>' +
      '<option value="PendingConfirmation">Ожидает</option>' +
      '<option value="Active">Активно</option>' +
      '<option value="Completed">Завершено</option>' +
      '<option value="Cancelled">Отменено</option></select>' +
      '</div>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>#</th><th>Место</th><th>Начало</th><th>Конец</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr></thead>' +
      '<tbody id="bk-tbody"></tbody></table></div>' +
      '<div class="pagination" id="bk-pag"></div>';

    document.getElementById('bk-search').addEventListener('input',  () => bookingsPage._applyFilters());
    document.getElementById('bk-filter').addEventListener('change', () => bookingsPage._applyFilters());

    await bookingsPage._load();
  },

  async _load() {
    const tbody = document.getElementById('bk-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:#aaa">Загрузка…</td></tr>';
    try {
      let bookingsPromise;
      if (Auth.isClient()) {
        const u = Auth.get();
        bookingsPromise = u?.clientId ? apiBooking.byClient(u.clientId) : Promise.resolve([]);
      } else {
        bookingsPromise = apiBooking.getAll(1, 200);
      }

      const [bookingsData, paymentsData] = await Promise.all([
        bookingsPromise,
        apiPayment.getAll(1, 500).catch(() => []),
      ]);

      bookingsPage._data     = Array.isArray(bookingsData)  ? bookingsData  : [];
      bookingsPage._payments = Array.isArray(paymentsData)  ? paymentsData  : [];
      bookingsPage._applyFilters();
    } catch (e) { toastErr(e.message); }
  },

  _applyFilters() {
    const q  = (document.getElementById('bk-search')?.value || '').toLowerCase();
    const st =  document.getElementById('bk-filter')?.value || '';
    let list = bookingsPage._data;
    if (st) list = list.filter(b => b.status === st);
    if (q)  list = list.filter(b =>
      (b.workPlace?.name || '').toLowerCase().includes(q) ||
      (b.client ? (b.client.name+' '+b.client.surname).toLowerCase() : '').includes(q));
    bookingsPage._renderTable(list);
  },

  _renderTable(list) {
    const tbody = document.getElementById('bk-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>📋</p><p>Нет бронирований</p></div></td></tr>';
      return;
    }

    const isClient = Auth.isClient();
    const isAdmin  = Auth.isAdmin();
    const isStaff  = Auth.isStaff();

    tbody.innerHTML = list.map(b => {
      const clientLine = !isClient && b.client
        ? '<div style="font-size:.75rem;color:var(--muted);margin-top:2px">' + esc(b.client.name + ' ' + b.client.surname) + '</div>'
        : '';

      const acts = bookingsPage._actions(b, isAdmin, isStaff, isClient);

      /* Сумма: если 0 — возможно покрыто абонементом, помечаем */
      const sumHtml = (b.lastPrice === 0 && b.status !== 'Cancelled')
        ? '<span style="color:#2d6a2d;font-size:.82rem;font-weight:600">🎟 0 ₽</span>'
        : fmtMoney(b.lastPrice || 0);

      return '<tr>' +
        '<td>#' + b.id_booking + '</td>' +
        '<td>' + esc(b.workPlace?.name || '—') + clientLine + '</td>' +
        '<td>' + fmtDate(b.startDate) + '</td>' +
        '<td>' + fmtDate(b.endDate)   + '</td>' +
        '<td>' + sumHtml + '</td>' +
        '<td>' + badge(BOOK_STATUS, b.status) + '</td>' +
        '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' + acts + '</div></td></tr>';
    }).join('');
  },

  _actions(b, isAdmin, isStaff, isClient) {
    let html = '';
    const payment = bookingsPage._payments.find(p => p.id_booking === b.id_booking);

    /* ── Подтвердить / отменить (admin) ── */
    if (b.status === 'PendingConfirmation' && isAdmin)
      html += '<button class="btn btn--success btn--sm" onclick="bookingsPage.confirm(' + b.id_booking + ')">Подтвердить</button>';

    if ((b.status === 'Active' || b.status === 'PendingConfirmation') && isAdmin)
      html += '<button class="btn btn--danger btn--sm" onclick="bookingsPage.cancel(' + b.id_booking + ')">Отменить</button>';

    if (b.status === 'PendingConfirmation' && isClient)
      html += '<button class="btn btn--danger btn--sm" onclick="bookingsPage.cancel(' + b.id_booking + ')">Отменить</button>';

    if (b.status === 'Active' && isStaff)
      html += '<button class="btn btn--ghost btn--sm" onclick="bookingsPage.complete(' + b.id_booking + ')">Завершить</button>';

    /* ── Оплата для клиента ── */
    if (b.status === 'Active' && isClient) {
      if (b.lastPrice === 0) {
        /* Место покрыто абонементом — доп. услуг нет */
        html += '<span class="badge badge--green">🎟 По абонементу</span>';
      } else if (!payment || payment.status === 'Cancelled') {
        html += '<span style="color:var(--muted);font-size:.8rem">Не оплачено</span>';
      } else if (payment.status === 'Pending') {
        html += '<span class="badge badge--yellow">⏳ Ожидает оплаты</span>';
      } else if (payment.status === 'Paid') {
        html += '<span class="badge badge--green">✓ Оплачено</span>';
      }
    }

    /* ── Оплата для персонала ──
       Если lastPrice === 0 — место покрыто абонементом, допов нет → не нужна оплата */
    if (b.status === 'Active' && (isAdmin || isStaff) && !isClient) {
      if (b.lastPrice === 0) {
        html += '<span class="badge badge--green">🎟 Абонемент</span>';
      } else if (!payment || payment.status === 'Cancelled' || payment.status === 'Pending') {
        html += '<button class="btn btn--success btn--sm" onclick="bookingsPage.staffPay(' + b.id_booking + ')">💰 Принять оплату</button>';
      } else if (payment.status === 'Paid') {
        html += '<span class="badge badge--green">✓ Оплачено</span>';
      }
    }

    if (!html) html = '<span style="color:#aaa;font-size:.8rem">—</span>';
    return html;
  },

  async staffPay(bookingId) {
    try {
      await apiPayment.create({ id_booking: bookingId });
      bookingsPage._showPaySuccess();
      await bookingsPage._load();
    } catch (e) { toastErr(e.message); }
  },

  _showPaySuccess() {
    buildModal('modal-pay-ok', '',
      '<div style="text-align:center;padding:12px 0">' +
      '<div style="font-size:3rem;margin-bottom:12px">✅</div>' +
      '<div style="font-size:1.2rem;font-weight:700;color:var(--dark);margin-bottom:6px">Оплата прошла успешно</div>' +
      '<div style="color:var(--muted);font-size:.9rem">Платёж зафиксирован в системе</div>' +
      '</div>',
      '<button class="btn btn--accent" style="width:100%" onclick="closeModal(\'modal-pay-ok\')">Закрыть</button>');
    openModal('modal-pay-ok');
  },

  async confirm(id) {
    if (!confirm('Подтвердить бронирование #' + id + '?')) return;
    try { await apiBooking.confirm(id); toastOk('Бронирование подтверждено'); await bookingsPage._load(); }
    catch (e) { toastErr(e.message); }
  },

  async cancel(id) {
    if (!confirm('Отменить бронирование #' + id + '?')) return;
    try { await apiBooking.cancel(id); toastOk('Бронирование отменено'); await bookingsPage._load(); }
    catch (e) { toastErr(e.message); }
  },

  async complete(id) {
    if (!confirm('Завершить бронирование #' + id + '?')) return;
    try { await apiBooking.complete(id); toastOk('Бронирование завершено'); await bookingsPage._load(); }
    catch (e) { toastErr(e.message); }
  },

  /* ── Форма создания (admin) ─────────────────────────────── */

  async openCreate() {
    let wps = [], clients = [], svcs = [];
    try {
      [wps, clients, svcs] = await Promise.all([
        apiWorkplace.getAll(),
        apiClient.getAll(1, 200),
        apiService.getAll().catch(() => []),
      ]);
    } catch(e) { toastErr(e.message); return; }

    const oldBook = document.getElementById('modal-book');
    if (oldBook) oldBook.remove();

    workplacesPage._data       = wps;
    workplacesPage._services   = svcs;
    workplacesPage._slotState  = { start: null, end: null };
    workplacesPage._selSvcs    = {};
    workplacesPage._bkAdminWp  = wps[0] || null;

    const wpOpts   = wps.map(w => '<option value="'+w.id_workplace+'">'+esc(w.name)+'</option>').join('');
    const svcsHtml = workplacesPage._buildServicesHtml();
    const today    = new Date().toISOString().slice(0, 10);

    bookingsPage._bcClients = clients;

    buildModal('modal-bk-create', 'Новое бронирование',
      '<div class="form-group"><label class="form-label">Клиент</label>' +
      '<div class="combo-wrap">' +
      '<input class="form-input" type="text" id="bc-client-search" placeholder="Начните вводить имя..." autocomplete="off">' +
      '<input type="hidden" id="bc-client">' +
      '<div class="combo-drop" id="bc-client-drop"></div>' +
      '</div></div>' +
      '<div class="form-group"><label class="form-label">Рабочее место</label>' +
      '<select class="form-select" id="bc-wp" onchange="bookingsPage._onBcWpChange()">'+wpOpts+'</select></div>' +
      '<div class="form-group"><label class="form-label">Дата</label>' +
      '<input class="form-input" type="date" id="bc-date" value="'+today+'" min="'+today+'"></div>' +
      '<div class="form-group">' +
      '<label class="form-label">Время (10:00 — 21:00) — первый клик начало, второй конец</label>' +
      '<div class="slot-scroll"><div class="slot-grid" id="bk-slots"></div></div>' +
      '<div id="bk-slot-info" class="slot-info"></div>' +
      '<input type="hidden" id="bk-slot-start"><input type="hidden" id="bk-slot-end"></div>' +
      (svcsHtml ? '<div class="form-group"><label class="form-label">Дополнительные услуги</label>'+svcsHtml+'</div>' : '') +
      '<div class="bk-total" id="bk-total" style="display:none"></div>' +
      '<div id="bc-err" class="form-error" style="display:none"></div>',
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-bk-create\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="bookingsPage.submitCreate()">Создать</button>');

    openModal('modal-bk-create');
    bookingsPage._initClientCombo();
    if (wps[0]) workplacesPage._loadSlots(wps[0].id_workplace, today);

    document.getElementById('bc-date')?.addEventListener('change', e => {
      workplacesPage._slotState = { start: null, end: null };
      document.getElementById('bk-slot-start').value = '';
      document.getElementById('bk-slot-end').value   = '';
      document.getElementById('bk-slot-info').style.display = 'none';
      const wpId = parseInt(document.getElementById('bc-wp')?.value);
      if (wpId) workplacesPage._loadSlots(wpId, e.target.value);
      if (workplacesPage._bkAdminWp) workplacesPage._updateTotal(workplacesPage._bkAdminWp);
    });

    document.querySelectorAll('.svc-check').forEach(cb =>
      cb.addEventListener('change', () => workplacesPage._onSvcChange(workplacesPage._bkAdminWp)));
    document.querySelectorAll('.svc-qty').forEach(inp =>
      inp.addEventListener('input', () => workplacesPage._onSvcChange(workplacesPage._bkAdminWp)));
  },

  _initClientCombo() {
    const input  = document.getElementById('bc-client-search');
    const hidden = document.getElementById('bc-client');
    const drop   = document.getElementById('bc-client-drop');
    if (!input) return;

    const render = q => {
      const val  = (q || '').toLowerCase();
      const hits = bookingsPage._bcClients.filter(c =>
        (c.name + ' ' + c.surname).toLowerCase().includes(val) ||
        (c.surname + ' ' + c.name).toLowerCase().includes(val)
      ).slice(0, 8);
      if (!hits.length) { drop.style.display = 'none'; return; }
      drop.innerHTML = hits.map(c =>
        '<div class="combo-item" data-id="'+c.id+'" data-name="'+esc(c.name+' '+c.surname)+'">' +
        esc(c.name + ' ' + c.surname) + '</div>'
      ).join('');
      drop.style.display = 'block';
    };

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('focus', () => render(input.value));
    drop.addEventListener('mousedown', e => {
      const item = e.target.closest('.combo-item');
      if (!item) return;
      e.preventDefault();
      hidden.value = item.dataset.id;
      input.value  = item.dataset.name;
      drop.style.display = 'none';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.combo-wrap')) drop.style.display = 'none';
    }, { capture: true, once: true });
  },

  _onBcWpChange() {
    const wpId = parseInt(document.getElementById('bc-wp')?.value);
    const date = document.getElementById('bc-date')?.value;
    workplacesPage._slotState  = { start: null, end: null };
    workplacesPage._bkAdminWp  = workplacesPage._data.find(x => x.id_workplace === wpId) || null;
    document.getElementById('bk-slot-start').value = '';
    document.getElementById('bk-slot-end').value   = '';
    const info  = document.getElementById('bk-slot-info');
    if (info)  info.style.display  = 'none';
    const total = document.getElementById('bk-total');
    if (total) total.style.display = 'none';
    if (wpId && date) workplacesPage._loadSlots(wpId, date);
  },

  async submitCreate() {
    const errEl   = document.getElementById('bc-err');
    errEl.style.display = 'none';

    const clientId = parseInt(document.getElementById('bc-client')?.value);
    const wpId     = parseInt(document.getElementById('bc-wp')?.value);
    const date     = document.getElementById('bc-date')?.value;
    const startVal = document.getElementById('bk-slot-start')?.value;
    const endVal   = document.getElementById('bk-slot-end')?.value;

    if (!date || startVal === '') {
      errEl.textContent = 'Выберите дату и время';
      errEl.style.display = 'block'; return;
    }

    const startHour  = parseInt(startVal);
    const endHour    = endVal !== '' ? parseInt(endVal) : startHour;
    const startLocal = new Date(date + 'T' + String(startHour).padStart(2,'0') + ':00:00');
    const endLocal   = new Date(date + 'T' + String(endHour + 1).padStart(2,'0') + ':00:00');

    const services = Object.entries(workplacesPage._selSvcs).map(([id, qty]) => ({
      id_service: parseInt(id), quantity: qty,
    }));

    const body = {
      id_client:    clientId,
      id_workPlace: wpId,
      startDate:    startLocal.toISOString(),
      endDate:      endLocal.toISOString(),
    };
    if (services.length) body.services = services;

    try {
      await apiBooking.create(body);
      toastOk('Бронирование создано');
      closeModal('modal-bk-create');
      await bookingsPage._load();
    } catch(e) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  },
};