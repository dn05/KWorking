
const clientsPage = {
    _data: [],

    async render() {
        const isAdmin = Auth.isAdmin();
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Клиенты</h2>' +
            (isAdmin ? '<button class="btn btn--accent btn--sm" onclick="clientsPage.openForm()">+ Добавить</button>' : '') +
            '</div>' +
            '<div class="toolbar"><input class="search-input" type="text" id="cl-search" placeholder="🔍 Поиск..."></div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Имя</th><th>Email</th><th>Телефон</th>' +
            (isAdmin ? '<th>Действия</th>' : '') + '</tr></thead>' +
            '<tbody id="cl-tbody"></tbody></table></div>';

        document.getElementById('cl-search').addEventListener('input', () => {
            const q = (document.getElementById('cl-search')?.value||'').toLowerCase();
            clientsPage._render(clientsPage._data.filter(c =>
                (c.name+' '+c.surname).toLowerCase().includes(q) ||
                (c.email||'').toLowerCase().includes(q) ||
                (c.phone||'').toLowerCase().includes(q)));
        });

        await clientsPage._load();
    },

    async _load() {
        try {
            const res = await apiClient.getAll(1, 200);
            clientsPage._data = Array.isArray(res) ? res : [];
            clientsPage._render(clientsPage._data);
        } catch(e) { toastErr(e.message); }
    },

    _render(list) {
        const tbody   = document.getElementById('cl-tbody');
        const isAdmin = Auth.isAdmin();
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><p>👥</p><p>Клиентов нет</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = list.map(c =>
            '<tr>' +
            '<td>#' + c.id + '</td>' +
            '<td><strong>' + esc(c.name+' '+c.surname) + '</strong></td>' +
            '<td>' + esc(c.email||'—') + '</td>' +
            '<td>' + esc(c.phone||'—') + '</td>' +
            (isAdmin ?
            '<td><div style="display:flex;gap:6px">' +
            '<button class="btn btn--ghost btn--sm" onclick="clientsPage.openForm(' + c.id + ')">Изменить</button>' +
            '<button class="btn btn--danger btn--sm" onclick="clientsPage.deleteClient(' + c.id + ')">Удалить</button>' +
            '</div></td>' : '') +
            '</tr>'
        ).join('');
    },

    openForm(id) {
        const c = id ? clientsPage._data.find(x => x.id === id) : null;
        buildModal('modal-cl-form', c ? 'Изменить клиента' : 'Новый клиент',
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Имя</label>' +
            '<input class="form-input" id="cf-name" value="' + esc(c?.name||'') + '" required></div>' +
            '<div class="form-group"><label class="form-label">Фамилия</label>' +
            '<input class="form-input" id="cf-surname" value="' + esc(c?.surname||'') + '" required></div></div>' +
            '<div class="form-group"><label class="form-label">Email</label>' +
            '<input class="form-input" type="email" id="cf-email" value="' + esc(c?.email||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Телефон</label>' +
            '<input class="form-input" type="tel" id="cf-phone" value="' + esc(c?.phone||'+7') + '">' +
            '<small style="color:var(--muted);font-size:.78rem">Формат: +7 и 10 цифр</small>' +
            '<div class="phone-err" style="display:none;color:#8a2222;font-size:.8rem;margin-top:2px">Можно вводить только цифры</div></div>' +
            '<div id="cf-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-cl-form\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="clientsPage.saveForm(' + (id||0) + ')">Сохранить</button>');
        openModal('modal-cl-form');
    },

    async saveForm(id) {
        const name    = document.getElementById('cf-name')?.value.trim();
        const surname = document.getElementById('cf-surname')?.value.trim();
        const errEl   = document.getElementById('cf-err');
        if (!name || !surname) { errEl.textContent='Введите имя и фамилию'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        const body = { name, surname,
            email: document.getElementById('cf-email')?.value.trim()||'',
            phone: document.getElementById('cf-phone')?.value.trim()||'' };
        try {
            if (id) { await apiClient.update(id,{...body,id}); toastOk('Клиент обновлён'); }
            else    { await apiClient.create(body); toastOk('Клиент добавлен'); }
            closeModal('modal-cl-form');
            await clientsPage._load();
        } catch(e) { errEl.textContent=e.message; errEl.style.display='block'; }
    },

    async deleteClient(id) {
        if (!confirm('Удалить клиента?')) return;
        try { await apiClient.delete(id); toastOk('Клиент удалён'); await clientsPage._load(); }
        catch(e) { toastErr(e.message); }
    },
};
