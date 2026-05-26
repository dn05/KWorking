/* ═══════════════════════════════════════════════════════════
   УСЛУГИ (admin)
═══════════════════════════════════════════════════════════ */
const servicesPage = {
    _data: [],

    async render() {
        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><h2>Услуги</h2>' +
            '<button class="btn btn--accent btn--sm" onclick="servicesPage.openForm()">+ Добавить</button></div>' +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>#</th><th>Название</th><th>Цена</th><th>Тип</th><th>Кол-во</th><th>Действия</th></tr></thead>' +
            '<tbody id="svc-tbody"></tbody></table></div>';
        await servicesPage._load();
    },

    async _load() {
        try {
            const res = await apiService.getAll();
            servicesPage._data = Array.isArray(res) ? res : [];
            servicesPage._render();
        } catch(e) { toastErr(e.message); }
    },

    _render() {
        const tbody = document.getElementById('svc-tbody');
        if (!tbody) return;
        if (!servicesPage._data.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>🛠</p><p>Услуг нет</p></div></td></tr>';
            return;
        }
        tbody.innerHTML = servicesPage._data.map(s =>
            '<tr>' +
            '<td>#' + s.id_service + '</td>' +
            '<td><strong>' + esc(s.name) + '</strong>' +
            (s.description ? '<br><small style="color:var(--muted)">' + esc(s.description) + '</small>' : '') + '</td>' +
            '<td>' + fmtMoney(s.price) + '</td>' +
            '<td>' + (s.pricingType === 'Hourly' ? '<span class="badge badge--blue">Почасовая</span>' : '<span class="badge badge--gray">Разовая</span>') + '</td>' +
            '<td>' + (s.availableQuantity ?? '∞') + ' шт.</td>' +
            '<td><div style="display:flex;gap:6px">' +
            '<button class="btn btn--ghost btn--sm" onclick="servicesPage.openForm(' + s.id_service + ')">Изменить</button>' +
            '<button class="btn btn--danger btn--sm" onclick="servicesPage.delete(' + s.id_service + ')">Удалить</button>' +
            '</div></td></tr>'
        ).join('');
    },

    openForm(id) {
        const s = id ? servicesPage._data.find(x => x.id_service === id) : null;
        buildModal('modal-svc-form', s ? 'Изменить услугу' : 'Новая услуга',
            '<div class="form-group"><label class="form-label">Название</label>' +
            '<input class="form-input" id="sf-name" value="' + esc(s?.name||'') + '" required></div>' +
            '<div class="form-group"><label class="form-label">Описание</label>' +
            '<input class="form-input" id="sf-desc" value="' + esc(s?.description||'') + '"></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Цена (₽)</label>' +
            '<input class="form-input" type="number" id="sf-price" value="' + (s?.price||'') + '" min="0" required></div>' +
            '<div class="form-group"><label class="form-label">Тип цены</label>' +
            '<select class="form-select" id="sf-type">' +
            '<option value="Flat"'   + (s?.pricingType==='Flat'   ||!s?' selected':'') + '>Разовая</option>' +
            '<option value="Hourly"' + (s?.pricingType==='Hourly'?' selected':'') + '>Почасовая</option>' +
            '</select></div></div>' +
            '<div class="form-group"><label class="form-label">Доступное количество (шт.)</label>' +
            '<input class="form-input" type="number" id="sf-qty" value="' + (s?.availableQuantity??1) + '" min="1"></div>' +
            '<div id="sf-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-svc-form\')">Отмена</button>' +
            '<button class="btn btn--accent" onclick="servicesPage.save(' + (id||0) + ')">Сохранить</button>');
        openModal('modal-svc-form');
    },

    async save(id) {
        const name  = document.getElementById('sf-name')?.value.trim();
        const errEl = document.getElementById('sf-err');
        if (!name) { errEl.textContent='Введите название'; errEl.style.display='block'; return; }
        errEl.style.display = 'none';
        const body = {
            name,
            description:       document.getElementById('sf-desc')?.value.trim() || '',
            price:             parseFloat(document.getElementById('sf-price')?.value) || 0,
            pricingType:       document.getElementById('sf-type')?.value || 'Flat',
            availableQuantity: parseInt(document.getElementById('sf-qty')?.value) || 1,
        };
        try {
            if (id) { await apiService.update(id, {...body, id_service: id}); toastOk('Услуга обновлена'); }
            else    { await apiService.create(body); toastOk('Услуга добавлена'); }
            closeModal('modal-svc-form');
            await servicesPage._load();
        } catch(e) { errEl.textContent=e.message; errEl.style.display='block'; }
    },

    async delete(id) {
        if (!confirm('Удалить услугу?')) return;
        try { await apiService.delete(id); toastOk('Услуга удалена'); await servicesPage._load(); }
        catch(e) { toastErr(e.message); }
    },
};
