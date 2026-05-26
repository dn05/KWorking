/* ═══════════════════════════════════════════════════════════
   ТАРИФЫ
═══════════════════════════════════════════════════════════ */
const tariffsPage = {
    _data: [],

    async render() {
        const isAdmin = Auth.isAdmin();
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Тарифы</h2>' +
            (isAdmin ? '<button class="btn btn--accent btn--sm" onclick="tariffsPage.openForm()">+ Добавить</button>' : '') +
            '</div>' +
            '<div class="toolbar"><input class="search-input" type="text" id="tr-search" placeholder="🔍 Поиск..."></div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Название</th><th>Цена</th><th>Тип</th><th>Описание</th>' +
            (isAdmin ? '<th>Действия</th>' : '') +
            '</tr></thead><tbody id="tr-tbody"></tbody></table></div>';

        document.getElementById('tr-search').addEventListener('input', () => {
            const q = (document.getElementById('tr-search')?.value||'').toLowerCase();
            tariffsPage._render(tariffsPage._data.filter(t =>
                (t.name||'').toLowerCase().includes(q) || (t.info||'').toLowerCase().includes(q)));
        });

        await tariffsPage._load();
    },

    async _load() {
        try {
            tariffsPage._data = await apiTariff.getAll();
            tariffsPage._render(tariffsPage._data);
        } catch (e) { toastErr(e.message); }
    },

    _render(list) {
        const tbody   = document.getElementById('tr-tbody');
        const isAdmin = Auth.isAdmin();
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>💰</p><p>Тарифов нет</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = list.map(t => {
            const typeStr = t.durationHours
                ? 'Почасовой (' + t.durationHours + ' ч)'
                : 'Абонемент (' + (t.validDays || '?') + ' дн.)';
            return '<tr>' +
                '<td>#' + t.id_tariff + '</td>' +
                '<td><strong>' + esc(t.name) + '</strong></td>' +
                '<td>' + fmtMoney(t.price) + '</td>' +
                '<td>' + esc(typeStr) + '</td>' +
                '<td style="color:var(--muted)">' + esc(t.info || '—') + '</td>' +
                (isAdmin ?
                '<td><div style="display:flex;gap:6px">' +
                '<button class="btn btn--ghost btn--sm" onclick="tariffsPage.openForm(' + t.id_tariff + ')">Изменить</button>' +
                '<button class="btn btn--danger btn--sm" onclick="tariffsPage.deleteTariff(' + t.id_tariff + ')">Удалить</button>' +
                '</div></td>' : '') +
                '</tr>';
        }).join('');
    },

    openForm(id) {
        const t = id ? tariffsPage._data.find(x => x.id_tariff === id) : null;
        const isHourly = !t || !!t.durationHours;
        buildModal('modal-tr-form', t ? 'Изменить тариф' : 'Новый тариф',
            '<div class="form-group"><label class="form-label">Название</label>' +
            '<input class="form-input" id="tf-name" value="' + esc(t?.name||'') + '" required></div>' +
            '<div class="form-group"><label class="form-label">Цена (₽)</label>' +
            '<input class="form-input" type="number" id="tf-price" value="' + (t?.price||'') + '" min="0" step="1"></div>' +
            '<div class="form-group"><label class="form-label">Тип</label>' +
            '<select class="form-select" id="tf-type" onchange="tariffsPage._toggleType()">' +
            '<option value="hourly"' + (isHourly?' selected':'') + '>Почасовой</option>' +
            '<option value="sub"'   + (!isHourly?' selected':'') + '>Абонемент</option>' +
            '</select></div>' +
            '<div id="tf-hours-row" class="form-group"' + (!isHourly?' style="display:none"':'') + '>' +
            '<label class="form-label">Длительность (часы)</label>' +
            '<input class="form-input" type="number" id="tf-hours" value="' + (t?.durationHours||'') + '" min="1"></div>' +
            '<div id="tf-days-row" class="form-group"' + (isHourly?' style="display:none"':'') + '>' +
            '<label class="form-label">Срок действия (дни)</label>' +
            '<input class="form-input" type="number" id="tf-days" value="' + (t?.validDays||'') + '" min="1"></div>' +
            '<div class="form-group"><label class="form-label">Описание</label>' +
            '<textarea class="form-input" id="tf-info">' + esc(t?.info||'') + '</textarea></div>' +
            '<div id="tf-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-tr-form\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="tariffsPage.saveForm(' + (id||0) + ')">Сохранить</button>');
        openModal('modal-tr-form');
    },

    _toggleType() {
        const isHourly = document.getElementById('tf-type')?.value === 'hourly';
        const hr = document.getElementById('tf-hours-row');
        const dr = document.getElementById('tf-days-row');
        if (hr) hr.style.display = isHourly ? '' : 'none';
        if (dr) dr.style.display = isHourly ? 'none' : '';
    },

    async saveForm(id) {
        const name  = document.getElementById('tf-name')?.value.trim();
        const price = parseFloat(document.getElementById('tf-price')?.value);
        const type  = document.getElementById('tf-type')?.value;
        const errEl = document.getElementById('tf-err');
        if (!name || isNaN(price)) {
            errEl.textContent = 'Введите название и цену'; errEl.style.display = 'block'; return;
        }
        errEl.style.display = 'none';
        const body = { name, price, info: document.getElementById('tf-info')?.value.trim()||'' };
        if (type === 'hourly') {
            const h = parseInt(document.getElementById('tf-hours')?.value);
            if (!h) { errEl.textContent = 'Укажите длительность'; errEl.style.display='block'; return; }
            body.durationHours = h;
        } else {
            const d = parseInt(document.getElementById('tf-days')?.value);
            if (!d) { errEl.textContent = 'Укажите срок действия'; errEl.style.display='block'; return; }
            body.validDays = d;
        }
        try {
            if (id) { await apiTariff.update(id, {...body, id_tariff:id}); toastOk('Тариф обновлён'); }
            else    { await apiTariff.create(body); toastOk('Тариф добавлен'); }
            closeModal('modal-tr-form');
            await tariffsPage._load();
        } catch(e) { errEl.textContent = e.message; errEl.style.display='block'; }
    },

    async deleteTariff(id) {
        if (!confirm('Удалить тариф?')) return;
        try { await apiTariff.delete(id); toastOk('Тариф удалён'); await tariffsPage._load(); }
        catch(e) { toastErr(e.message); }
    },
};
