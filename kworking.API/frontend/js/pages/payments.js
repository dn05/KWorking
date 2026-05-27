
const paymentsPage = {
    _data: [],

    async render() {
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Платежи</h2>' +
            '<button class="btn btn--ghost btn--sm" onclick="paymentsPage.openReport()">📊 Отчёт</button></div>' +
            '<div class="toolbar">' +
            '<input class="search-input" type="text" id="pm-search" placeholder="🔍 Поиск по бронированию...">' +
            '<select class="form-select" id="pm-filter" style="max-width:180px">' +
            '<option value="">Все статусы</option>' +
            '<option value="Pending">Не оплачено</option>' +
            '<option value="Paid">Оплачено</option>' +
            '<option value="Cancelled">Отменено</option></select>' +
            '</div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Бронирование</th><th>Клиент</th><th>Сумма</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>' +
            '<tbody id="pm-tbody"></tbody></table></div>';

        document.getElementById('pm-search').addEventListener('input',  () => paymentsPage._applyFilters());
        document.getElementById('pm-filter').addEventListener('change', () => paymentsPage._applyFilters());

        await paymentsPage._load();
    },

    async _load() {
        try {
            const res = await apiPayment.getAll(1, 100);
            paymentsPage._data = Array.isArray(res) ? res : [];
            paymentsPage._applyFilters();
        } catch(e) { toastErr(e.message); }
    },

    _applyFilters() {
        const q  = (document.getElementById('pm-search')?.value||'').toLowerCase();
        const st = document.getElementById('pm-filter')?.value||'';
        let list = paymentsPage._data;
        if (st) list = list.filter(p => p.status === st);
        if (q)  list = list.filter(p => String(p.id_booking).includes(q));
        paymentsPage._render(list);
    },

    _render(list) {
        const tbody = document.getElementById('pm-tbody');
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>💳</p><p>Платежей нет</p></div></td></tr>';
            return;
        }
        const canPay = Auth.isAdmin() || Auth.isCashier();
        tbody.innerHTML = list.map(p => {
            const clientName = p.booking?.client
                ? esc(p.booking.client.name + ' ' + p.booking.client.surname)
                : (p.client ? esc(p.client.name + ' ' + p.client.surname) : '—');
            const wpName = p.booking?.workPlace?.name || (p.workPlaceName ? esc(p.workPlaceName) : '—');

            let acts = '';
            if (p.status === 'Paid') {
                acts = '<span class="badge badge--green">✓ Оплачено</span>';
            } else {
                acts = '<span style="color:var(--muted);font-size:.8rem">—</span>';
            }
            return '<tr>' +
                '<td>#' + p.id_payment + '</td>' +
                '<td>#' + p.id_booking +
                    (wpName !== '—' ? '<br><small style="color:var(--muted)">' + esc(wpName) + '</small>' : '') + '</td>' +
                '<td>' + clientName + '</td>' +
                '<td><strong>' + fmtMoney(p.price||0) + '</strong></td>' +
                '<td>' + badge(PAY_STATUS, p.status) + '</td>' +
                '<td>' + fmtDate(p.paymentDate) + '</td>' +
                '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' + acts + '</div></td></tr>';
        }).join('');
    },

    async pay(id) {
        if (!confirm('Подтвердить оплату?')) return;
        try { await apiPayment.pay(id); toastOk('Оплата подтверждена'); await paymentsPage._load(); }
        catch(e) { toastErr(e.message); }
    },
    async cancel(id) {
        if (!confirm('Отменить платёж?')) return;
        try { await apiPayment.cancel(id); toastOk('Платёж отменён'); await paymentsPage._load(); }
        catch(e) { toastErr(e.message); }
    },

    openReport() {
        const today = new Date().toISOString().slice(0,10);
        const weekAgo = new Date(Date.now()-7*86400000).toISOString().slice(0,10);
        buildModal('modal-report', 'Отчёт по платежам',
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">С даты</label>' +
            '<input class="form-input" type="date" id="rp-start" value="' + weekAgo + '"></div>' +
            '<div class="form-group"><label class="form-label">По дату</label>' +
            '<input class="form-input" type="date" id="rp-end" value="' + today + '"></div></div>' +
            '<button class="btn btn--accent" onclick="paymentsPage.runReport()">Получить</button>' +
            '<div id="rp-result" style="margin-top:20px"></div>',
            '', true);
        openModal('modal-report');
    },

    async runReport() {
        const start = document.getElementById('rp-start')?.value;
        const end   = document.getElementById('rp-end')?.value;
        const res   = document.getElementById('rp-result');
        if (!res) return;
        res.innerHTML = 'Загрузка…';
        try {
            const data = await apiPayment.report(start, end);
            res.innerHTML =
                '<div class="stat-card" style="margin-top:0;text-align:center">' +
                '<div class="stat-card__icon">💰</div>' +
                '<div class="stat-card__value">' + fmtMoney(data?.totalAmount||0) + '</div>' +
                '<div class="stat-card__label">Итого за период (' + (data?.totalCount||0) + ' платежей)</div></div>';
        } catch(e) { res.innerHTML = '<div class="form-error">' + esc(e.message) + '</div>'; }
    },
};
