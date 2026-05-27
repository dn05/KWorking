
const usersPage = {
    _data: [],

    async render() {
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Пользователи</h2>' +
            '<div style="display:flex;gap:8px">' +
            '<button class="btn btn--ghost btn--sm" onclick="usersPage.openGrantRole()">Выдать права</button>' +
            '<button class="btn btn--accent btn--sm" onclick="usersPage.openCreate()">+ Добавить</button>' +
            '</div></div>' +
            '<div class="toolbar">' +
            '<input class="search-input" type="text" id="us-search" placeholder="🔍 Поиск...">' +
            '<select class="form-select" id="us-filter" style="max-width:180px">' +
            '<option value="">Все роли</option>' +
            '<option value="Employee">Сотрудник</option>' +
            '<option value="Cashier">Кассир</option>' +
            '<option value="Administrator">Администратор</option>' +
            '</select></div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Логин</th><th>Роль</th><th>Действия</th></tr></thead>' +
            '<tbody id="us-tbody"></tbody></table></div>';

        document.getElementById('us-search').addEventListener('input',  () => usersPage._applyFilters());
        document.getElementById('us-filter').addEventListener('change', () => usersPage._applyFilters());

        await usersPage._load();
    },

    async _load() {
        try {
            usersPage._data = await apiUser.getAll();
            usersPage._applyFilters();
        } catch(e) { toastErr(e.message); }
    },

    _applyFilters() {
        const q = (document.getElementById('us-search')?.value||'').toLowerCase();
        const r = document.getElementById('us-filter')?.value||'';
        let list = usersPage._data.filter(u => u.role !== 'Client');
        if (r) list = list.filter(u => u.role === r);
        if (q) list = list.filter(u => (u.login||'').toLowerCase().includes(q));
        usersPage._render(list);
    },

    _render(list) {
        const tbody = document.getElementById('us-tbody');
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>👤</p><p>Пользователей нет</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = list.map(u => {
            const roleLabel = ROLE_LABELS[u.role] || u.role;
            const roleCls = { Employee:'green', Cashier:'yellow', Administrator:'gray', SuperAdmin:'red' }[u.role] || 'gray';
            return '<tr>' +
                '<td>#' + u.id_user + '</td>' +
                '<td><strong>' + esc(u.login) + '</strong></td>' +
                '<td><span class="badge badge--' + roleCls + '">' + esc(roleLabel) + '</span></td>' +
                '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="btn btn--ghost btn--sm" onclick="usersPage.openEditData(' + u.id_user + ')">Редактировать</button>' +
                '<button class="btn btn--ghost btn--sm" onclick="usersPage.openChangePass(' + u.id_user + ')">Сменить пароль</button>' +
                '<button class="btn btn--danger btn--sm" onclick="usersPage.deleteUser(' + u.id_user + ')">Удалить</button>' +
                '</div></td></tr>';
        }).join('');
    },


    openGrantRole() {
        const roleOpts = ['Employee','Cashier','Administrator'].map(r =>
            '<option value="' + r + '">' + esc(ROLE_LABELS[r] || r) + '</option>'
        ).join('');

        buildModal('modal-grant-role', 'Выдать права',
            '<div class="form-group"><label class="form-label">Пользователь</label>' +
            '<div class="combo" id="gr-combo">' +
            '<input class="form-input combo__input" id="gr-search" placeholder="Поиск по имени..." autocomplete="off">' +
            '<div class="combo__drop" id="gr-drop" style="display:none"></div>' +
            '</div>' +
            '<input type="hidden" id="gr-user-id">' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Новая роль</label>' +
            '<select class="form-select" id="gr-role">' + roleOpts + '</select></div>' +
            '<div id="gr-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-grant-role\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="usersPage.saveGrantRole()">Назначить</button>');
        openModal('modal-grant-role');

        const input = document.getElementById('gr-search');
        const drop  = document.getElementById('gr-drop');

        const renderDrop = (q) => {
            const list = q
                ? usersPage._data.filter(u =>
                    (u.login||'').toLowerCase().includes(q) ||
                    (u.clientName||'').toLowerCase().includes(q))
                : usersPage._data;

            if (!list.length) {
                drop.innerHTML = '<div class="combo__item combo__item--empty">Ничего не найдено</div>';
            } else {
                drop.innerHTML = list.map(u =>
                    '<div class="combo__item" data-id="' + u.id_user + '" data-label="' +
                    esc(u.login + (u.clientName ? ' — ' + u.clientName : '')) + '">' +
                    '<span class="combo__login">' + esc(u.login) + '</span>' +
                    (u.clientName ? '<span class="combo__name">' + esc(u.clientName) + '</span>' : '') +
                    '<span class="badge badge--' + ({Client:'blue',Employee:'green',Cashier:'yellow',Administrator:'gray',SuperAdmin:'red'}[u.role]||'gray') + '">' +
                    esc(ROLE_LABELS[u.role]||u.role) + '</span>' +
                    '</div>'
                ).join('');
                drop.querySelectorAll('.combo__item[data-id]').forEach(el => {
                    el.addEventListener('mousedown', e => {
                        e.preventDefault();
                        document.getElementById('gr-user-id').value = el.dataset.id;
                        input.value = el.dataset.label;
                        drop.style.display = 'none';
                        document.getElementById('gr-err').style.display = 'none';
                    });
                });
            }
            drop.style.display = 'block';
        };

        input.addEventListener('focus', () => renderDrop(input.value.toLowerCase().trim()));
        input.addEventListener('input', () => {
            document.getElementById('gr-user-id').value = '';
            renderDrop(input.value.toLowerCase().trim());
        });
        input.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 150));
    },

    async saveGrantRole() {
        const userId = parseInt(document.getElementById('gr-user-id')?.value);
        const role   = document.getElementById('gr-role')?.value;
        const errEl  = document.getElementById('gr-err');
        if (!userId || !role) { errEl.textContent = 'Выберите пользователя и роль'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        try {
            await apiUser.setRole(userId, role);
            toastOk('Роль назначена');
            closeModal('modal-grant-role');
            await usersPage._load();
        } catch(e) { errEl.textContent = e.message; errEl.style.display='block'; }
    },
    

    async openEditData(userId) {
        const u = usersPage._data.find(x => x.id_user === userId);
        if (!u) return;

        let c = null;
        if (u.id_client) {
            try { c = await apiClient.getById(u.id_client); } catch {}
        }

        buildModal('modal-edit-data', 'Редактировать данные',
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Имя</label>' +
            '<input class="form-input" id="ed-name" value="' + esc(c?.name||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Фамилия</label>' +
            '<input class="form-input" id="ed-surname" value="' + esc(c?.surname||'') + '"></div></div>' +
            '<div class="form-group"><label class="form-label">Телефон</label>' +
            '<input class="form-input" type="tel" id="ed-phone" value="' + esc(c?.phone||'+7') + '">' +
            '<small style="color:var(--muted);font-size:.78rem">Формат: +7 и 10 цифр</small>' +
            '<div class="phone-err" style="display:none;color:#8a2222;font-size:.8rem;margin-top:2px">Можно вводить только цифры</div></div>' +
            '<div class="form-group"><label class="form-label">Email</label>' +
            '<input class="form-input" type="email" id="ed-email" value="' + esc(c?.email||'') + '"></div>' +
            '<div id="ed-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-edit-data\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="usersPage.saveEditData(' + userId + ',' + (u.id_client||0) + ')">Сохранить</button>');
        openModal('modal-edit-data');
    },

    async saveEditData(userId, clientId) {
        const name    = document.getElementById('ed-name')?.value.trim();
        const surname = document.getElementById('ed-surname')?.value.trim();
        const phone   = document.getElementById('ed-phone')?.value.trim();
        const email   = document.getElementById('ed-email')?.value.trim();
        const errEl   = document.getElementById('ed-err');
        if (!name || !surname) { errEl.textContent='Введите имя и фамилию'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        try {
            if (clientId) {
                await apiClient.update(clientId, { id: clientId, name, surname, phone, email });
            }
            toastOk('Данные обновлены');
            closeModal('modal-edit-data');
            await usersPage._load();
        } catch(e) { errEl.textContent = e.message; errEl.style.display='block'; }
    },


    openChangePass(userId) {
        const u = usersPage._data.find(x => x.id_user === userId);
        if (!u) return;
        buildModal('modal-chpass', 'Сменить пароль — ' + esc(u.login),
            '<div class="form-group"><label class="form-label">Новый пароль</label>' +
            '<input class="form-input" type="password" id="cp-pass" autocomplete="new-password" placeholder="Введите новый пароль"></div>' +
            '<div class="form-group"><label class="form-label">Повторите пароль</label>' +
            '<input class="form-input" type="password" id="cp-pass2" autocomplete="new-password" placeholder="Повторите пароль"></div>' +
            '<div id="cp-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-chpass\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="usersPage.saveChangePass(' + userId + ')">Сохранить</button>');
        openModal('modal-chpass');
    },

    async saveChangePass(userId) {
        const pass  = document.getElementById('cp-pass')?.value;
        const pass2 = document.getElementById('cp-pass2')?.value;
        const errEl = document.getElementById('cp-err');
        if (!pass) { errEl.textContent = 'Введите новый пароль'; errEl.style.display='block'; return; }
        if (pass !== pass2) { errEl.textContent = 'Пароли не совпадают'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        const u = usersPage._data.find(x => x.id_user === userId);
        try {
            await apiUser.update(userId, { id_user: userId, login: u.login, role: u.role, password: pass });
            toastOk('Пароль изменён');
            closeModal('modal-chpass');
        } catch(e) { errEl.textContent = e.message; errEl.style.display='block'; }
    },


    openCreate() {
        buildModal('modal-us-create', 'Новый пользователь',
            '<div class="form-group"><label class="form-label">Логин</label>' +
            '<input class="form-input" id="uc-login" required autocomplete="off"></div>' +
            '<div class="form-group"><label class="form-label">Пароль</label>' +
            '<input class="form-input" type="password" id="uc-pass" required autocomplete="new-password"></div>' +
            '<div class="form-group"><label class="form-label">Роль</label>' +
            '<select class="form-select" id="uc-role">' +
            ['Employee','Cashier','Administrator'].map(r =>
                '<option value="' + r + '">' + esc(ROLE_LABELS[r]||r) + '</option>').join('') +
            '</select></div>' +
            '<div id="uc-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-us-create\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="usersPage.saveCreate()">Создать</button>');
        openModal('modal-us-create');
    },

    async saveCreate() {
        const login = document.getElementById('uc-login')?.value.trim();
        const pass  = document.getElementById('uc-pass')?.value;
        const role  = document.getElementById('uc-role')?.value;
        const errEl = document.getElementById('uc-err');
        if (!login) { errEl.textContent='Введите логин'; errEl.style.display='block'; return; }
        if (!pass)  { errEl.textContent='Введите пароль'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        try {
            await apiUser.create({ login, password: pass, role });
            toastOk('Пользователь создан');
            closeModal('modal-us-create');
            await usersPage._load();
        } catch(e) { errEl.textContent = e.message; errEl.style.display='block'; }
    },

    async deleteUser(id) {
        if (!confirm('Удалить пользователя?')) return;
        try { await apiUser.delete(id); toastOk('Пользователь удалён'); await usersPage._load(); }
        catch(e) { toastErr(e.message); }
    },
};
