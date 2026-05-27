
const subscriptionsPage = {
    _data: [],

    async render() {
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Абонементы</h2></div>' +
            '<div class="toolbar">' +
            '<select class="form-select" id="sub-filter" style="max-width:200px">' +
            '<option value="">Все статусы</option>' +
            '<option value="Pending">Ожидают активации</option>' +
            '<option value="Active">Активные</option>' +
            '<option value="Expired">Истёкшие</option>' +
            '<option value="Cancelled">Отменённые</option>' +
            '</select></div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Клиент</th><th>Статус</th><th>Начало</th><th>Конец</th><th>Цена</th><th>Действия</th></tr></thead>' +
            '<tbody id="sub-tbody"></tbody></table></div>';

        document.getElementById('sub-filter').addEventListener('change', () => subscriptionsPage._applyFilters());
        await subscriptionsPage._load();
    },

    async _load() {
        try {
            const res = await apiSubscription.getAll();
            subscriptionsPage._data = Array.isArray(res) ? res : [];
            subscriptionsPage._applyFilters();
        } catch(e) { toastErr(e.message); }
    },

    _applyFilters() {
        const st = document.getElementById('sub-filter')?.value || '';
        const list = st ? subscriptionsPage._data.filter(s => s.status === st) : subscriptionsPage._data;
        subscriptionsPage._render(list);
    },

    _render(list) {
        const tbody = document.getElementById('sub-tbody');
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>🎟</p><p>Абонементов нет</p></div></td></tr>';
            return;
        }
        const SUB_STATUS = {
            Pending:   ['Ожидает',  'badge--yellow'],
            Active:    ['Активен',  'badge--green'],
            Expired:   ['Истёк',    'badge--gray'],
            Cancelled: ['Отменён',  'badge--red'],
        };
        tbody.innerHTML = list.map(s => {
            const clientName = s.client ? esc(s.client.name + ' ' + s.client.surname) : '—';
            const [label, cls] = SUB_STATUS[s.status] || [s.status, 'badge--gray'];
            let acts = '';
            if (s.status === 'Pending') {
                acts = '<button class="btn btn--success btn--sm" onclick="subscriptionsPage.activate(' + s.id_subscription + ')">✓ Активировать</button>' +
                       '<button class="btn btn--danger btn--sm"  onclick="subscriptionsPage.cancel(' + s.id_subscription + ')">Отменить</button>';
            } else if (s.status === 'Active') {
                acts = '<button class="btn btn--danger btn--sm" onclick="subscriptionsPage.cancel(' + s.id_subscription + ')">Отменить</button>';
            } else {
                acts = '<span style="color:var(--muted);font-size:.8rem">—</span>';
            }
            return '<tr>' +
                '<td>#' + s.id_subscription + '</td>' +
                '<td>' + clientName + '</td>' +
                '<td><span class="badge ' + cls + '">' + label + '</span></td>' +
                '<td>' + (s.startDate ? fmtDate(s.startDate) : '—') + '</td>' +
                '<td>' + (s.endDate   ? fmtDate(s.endDate)   : '—') + '</td>' +
                '<td>' + fmtMoney(s.price || 5000) + '</td>' +
                '<td><div style="display:flex;gap:6px">' + acts + '</div></td></tr>';
        }).join('');
    },

    async activate(id) {
        if (!confirm('Активировать абонемент #' + id + '? Срок действия — 1 месяц с сегодня.')) return;
        try { await apiSubscription.activate(id); toastOk('Абонемент активирован'); await subscriptionsPage._load(); }
        catch(e) { toastErr(e.message); }
    },

    async cancel(id) {
        if (!confirm('Отменить абонемент #' + id + '?')) return;
        try { await apiSubscription.cancel(id); toastOk('Абонемент отменён'); await subscriptionsPage._load(); }
        catch(e) { toastErr(e.message); }
    },
};
