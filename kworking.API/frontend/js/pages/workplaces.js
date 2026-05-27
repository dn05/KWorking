

const WP_TYPES = {
  OpenSpace:   { label: 'Открытое пространство', icon: '🏢' },
  Room:        { label: 'Комнаты',                icon: '🚪' },
  MeetingRoom: { label: 'Переговорные',           icon: '👥' },
};

const workplacesPage = {
  _data:     [],
  _services: [],
  _slotState: { start: null, end: null },
  _selSvcs:  {},


  _bkDate:      null,
  _bkView:      'strip',
  _bkCalYear:   null,
  _bkCalMonth:  null,
  _bkWpId:      null,
  _bkWp:        null,
  _bkTakenHours:{},
  _bkWpType:    'Room',
  _bkWpCap:     1,
  _bkArrival:   null,
  _bkDeparture: null,


  _subActive: false,

  async render() {
    const isAdmin  = Auth.isAdmin();

    document.getElementById('page-content').innerHTML =
      '<div class="page-hd">' +
      '<h2>Рабочие места</h2>' +
      (isAdmin ? '<button class="btn btn--accent btn--sm" onclick="workplacesPage.openForm()">+ Добавить</button>' : '') +
      '</div>' +
      '<div class="toolbar">' +
      '<input class="search-input" type="text" id="wp-search" placeholder="🔍 Поиск...">' +
      '<select class="form-select" id="wp-filter" style="max-width:180px">' +
      '<option value="">Все типы</option>' +
      '<option value="OpenSpace">Открытое пространство</option>' +
      '<option value="Room">Комнаты</option>' +
      '<option value="MeetingRoom">Переговорные</option>' +
      '</select></div>' +
      '<div id="wp-content"></div>';

    document.getElementById('wp-search').addEventListener('input',  () => workplacesPage._applyFilters());
    document.getElementById('wp-filter').addEventListener('change', () => workplacesPage._applyFilters());

    await workplacesPage._load();
  },

  async _load() {
    try {
      const [wps, svcs] = await Promise.all([
        apiWorkplace.getAll(),
        apiService.getAll().catch(() => []),
      ]);
      workplacesPage._data     = Array.isArray(wps)  ? wps  : [];
      workplacesPage._services = Array.isArray(svcs) ? svcs : [];

      /* Проверяем абонемент для клиента */
      if (Auth.isClient()) {
        try {
          const sub = await apiSubscription.getMine().catch(() => null);
          workplacesPage._subActive = !!(sub && sub.status === 'Active');
        } catch { workplacesPage._subActive = false; }
      }

      workplacesPage._applyFilters();
    } catch (e) { toastErr(e.message); }
  },

  _applyFilters() {
    const q  = (document.getElementById('wp-search')?.value || '').toLowerCase();
    const tp =  document.getElementById('wp-filter')?.value || '';
    let list = workplacesPage._data;
    if (tp) list = list.filter(w => w.type === tp);
    if (q)  list = list.filter(w =>
      (w.name||'').toLowerCase().includes(q) ||
      (w.type||'').toLowerCase().includes(q));
    workplacesPage._renderAll(list);
  },

  _renderAll(list) {
    const wrap = document.getElementById('wp-content');
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
        '<span class="wp-section__count"></span>' +
        '</div>' +
        '<div class="cards-grid">' +
        group.map(w => workplacesPage._cardHtml(w)).join('') +
        '</div></div>';
    });

    const untyped = list.filter(w => !order.includes(w.type));
    if (untyped.length) {
      html += '<div class="wp-section"><div class="wp-section__hd">' +
        '<span class="wp-section__icon">📌</span>' +
        '<h3 class="wp-section__title">Прочие</h3></div>' +
        '<div class="cards-grid">' +
        untyped.map(w => workplacesPage._cardHtml(w)).join('') +
        '</div></div>';
    }

    wrap.innerHTML = html;
  },

      _cardHtml(w) {
    console.log('Карточка:', w.id_workplace, w.name, 'photoUrl =', w.photoUrl);

    const isAdmin  = Auth.isAdmin();
    const isClient = Auth.isClient();
    const hasSub   = workplacesPage._subActive;

    let priceHtml = '';
    if (w.pricePerHour) {
      if (hasSub) {
        priceHtml = `<div class="wp-card__price" style="display:flex;align-items:center;gap:6px">
          <span style="text-decoration:line-through;color:var(--muted);font-size:.85rem">${fmtMoney(w.pricePerHour)}/ч</span>
          <span style="color:#2d6a2d;font-weight:700;font-size:.85rem">🎟 Бесплатно</span>
        </div>`;
      } else {
        priceHtml = `<div class="wp-card__price">${fmtMoney(w.pricePerHour)}/ч</div>`;
      }
    }

    const cls = w.status === 'free' ? 'wp-card--free' : w.status === 'busy' ? 'wp-card--busy' : 'wp-card--booked';

    const baseUrl = 'http://127.0.0.1:5175';
    let photoHtml = '';
    
    if (w.photoUrl) {
      const fullUrl = w.photoUrl.startsWith('http') ? w.photoUrl : baseUrl + w.photoUrl;
      photoHtml = `<img src="${fullUrl}" 
                       style="width:100%; height:160px; object-fit:cover; border-radius:10px; margin-bottom:12px;" 
                       alt="${esc(w.name)}"
                       onerror="console.error('Ошибка загрузки фото:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    
    photoHtml += `<div class="photo-placeholder" style="height:160px; background:#f0e9dc; border-radius:10px; margin-bottom:12px; display:${w.photoUrl ? 'none' : 'flex'}; align-items:center; justify-content:center; color:#aaa; font-size:2.5rem; flex-direction:column;">
      📷
      <small style="font-size:0.75rem;margin-top:4px">Нет фото</small>
    </div>`;

    let actions = '';
    if (isClient) {
      actions += `<button class="btn btn--accent btn--sm" onclick="workplacesPage.openBooking(${w.id_workplace})">Выбрать время</button>`;
    }
    if (isAdmin) {
      actions += `<button class="btn btn--ghost btn--sm" onclick="workplacesPage.openForm(${w.id_workplace})">Изменить</button>`;
      actions += `<button class="btn btn--danger btn--sm" onclick="workplacesPage.deleteWp(${w.id_workplace})">Удалить</button>`;
    }

    return `<div class="wp-card ${cls}">
      ${photoHtml}
      <div class="wp-card__head"><span class="wp-card__name">${esc(w.name)}</span></div>
      ${priceHtml}
      <div class="wp-card__meta">
        <span class="wp-type-chip">${esc((WP_TYPES[w.type]?.icon || '📌') + ' ' + (WP_TYPES[w.type]?.label || w.type || 'Рабочее место'))}</span>
        ${w.capacity ? `<span class="wp-cap-chip">· до ${w.capacity} чел.</span>` : ''}
      </div>
      ${w.description ? `<div class="wp-card__desc">${esc(w.description)}</div>` : ''}
      ${actions ? `<div class="wp-card__acts">${actions}</div>` : ''}
    </div>`;
  },



      openForm(id) {
    const w = id ? workplacesPage._data.find(x => x.id_workplace === id) : null;
    buildModal('modal-wp-form', w ? 'Изменить место' : 'Новое рабочее место',
      '<div class="form-group"><label class="form-label">Название</label>' +
      '<input class="form-input" id="wf-name" value="' + esc(w?.name||'') + '" required></div>' +
      '<div class="form-group"><label class="form-label">Тип</label>' +
      '<select class="form-select" id="wf-type">' +
      '<option value="">— выберите —</option>' +
      ['OpenSpace','Room','MeetingRoom'].map(t =>
        '<option value="' + t + '"' + (w?.type===t?' selected':'') + '>' +
        (WP_TYPES[t]?.label||t) + '</option>').join('') +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">Цена за час (₽)</label>' +
      '<input class="form-input" type="number" id="wf-price" value="' + (w?.pricePerHour||'') + '" min="0" placeholder="напр. 600"></div>' +
      '<div class="form-group"><label class="form-label">Вместимость</label>' +
      '<input class="form-input" type="number" id="wf-cap" value="' + (w?.capacity||1) + '" min="1"></div>' +

      '<div class="form-group"><label class="form-label">Фото</label>' +
      '<input type="file" id="wf-photo-file" accept="image/*" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:6px;">' +
      '<input type="hidden" id="wf-photo-url" value="' + esc(w?.photoUrl||'') + '">' +
      '</div>' +
      
      '<div class="form-group"><label class="form-label">Описание</label>' +
      '<textarea class="form-input" id="wf-desc">' + esc(w?.description||'') + '</textarea></div>' +
      '<div id="wf-err" class="form-error" style="display:none"></div>',
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-wp-form\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="workplacesPage.saveForm(' + (id||0) + ')">Сохранить</button>');
    openModal('modal-wp-form');
  },

    async saveForm(id) {
    const name  = document.getElementById('wf-name')?.value.trim();
    const errEl = document.getElementById('wf-err');
    if (!name) { errEl.textContent='Введите название'; errEl.style.display='block'; return; }
    errEl.style.display = 'none';

    let photoUrl = document.getElementById('wf-photo-url')?.value || null;

    const fileInput = document.getElementById('wf-photo-file');
    if (fileInput?.files?.length > 0) {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        const res = await fetch(API_BASE + '/workplace/upload-photo', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('kw_token') },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          photoUrl = data.photoUrl;
        } else {
          throw new Error('Не удалось загрузить фото');
        }
      } catch (e) {
        errEl.textContent = e.message;
        errEl.style.display = 'block';
        return;
      }
    }

    const body = {
      name,
      type:         document.getElementById('wf-type')?.value || null,
      pricePerHour: parseFloat(document.getElementById('wf-price')?.value) || 0,
      capacity:     parseInt(document.getElementById('wf-cap')?.value) || 1,
      description:  document.getElementById('wf-desc')?.value.trim() || '',
      photoUrl:     photoUrl
    };

    try {
      if (id) {
        await apiWorkplace.update(id, {...body, id_workplace: id, status: workplacesPage._data.find(x=>x.id_workplace===id)?.status||'free'});
        toastOk('Место обновлено');
      } else {
        await apiWorkplace.create(body);
        toastOk('Место добавлено');
      }
      closeModal('modal-wp-form');
      await workplacesPage._load();
    } catch (e) { 
      errEl.textContent = e.message; 
      errEl.style.display = 'block'; 
    }
  },

  async deleteWp(id) {
    if (!confirm('Удалить рабочее место?')) return;
    try { await apiWorkplace.delete(id); toastOk('Место удалено'); await workplacesPage._load(); }
    catch (e) { toastErr(e.message); }
  },



  openBooking(wpId) {
    const w = workplacesPage._data.find(x => x.id_workplace === wpId);
    if (!w) return;

    const oldAdmin = document.getElementById('modal-bk-create');
    if (oldAdmin) oldAdmin.remove();

    const now   = new Date();
    const today = workplacesPage._ymd(now);

    workplacesPage._slotState   = { start: null, end: null };
    workplacesPage._selSvcs     = {};
    workplacesPage._bkDate      = today;
    workplacesPage._bkView      = 'strip';
    workplacesPage._bkCalYear   = now.getFullYear();
    workplacesPage._bkCalMonth  = now.getMonth();
    workplacesPage._bkWpId      = wpId;
    workplacesPage._bkWp        = w;
    workplacesPage._bkArrival   = null;
    workplacesPage._bkDeparture = null;
    workplacesPage._bkTakenHours= {};

    buildModal('modal-book', 'Забронировать: ' + esc(w.name),
      workplacesPage._buildBkBody(today, w),
      '<button class="btn btn--ghost" onclick="closeModal(\'modal-book\')">Отмена</button>' +
      '<button class="btn btn--accent" onclick="workplacesPage.submitBooking(' + wpId + ')">Забронировать</button>',
      true);

    openModal('modal-book');
    workplacesPage._renderDateStrip(today);
    workplacesPage._loadSlots(wpId, today);

    document.querySelectorAll('.svc-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const lbl = document.getElementById('bk-svc-lbl-' + cb.dataset.id);
        if (lbl) lbl.classList.toggle('bk-svc-card--active', cb.checked);
        workplacesPage._onSvcChange(w);
      });
    });
  },

  _buildBkBody(today, w) {
    const hasSub   = workplacesPage._subActive;
    const svcsHtml = workplacesPage._buildServicesHtml();

 
    const subBanner = hasSub
      ? '<div style="' +
          'display:flex;align-items:center;gap:10px;' +
          'background:#f0faf0;border:1.5px solid #4caf50;border-radius:10px;' +
          'padding:12px 16px;margin-bottom:16px' +
        '">' +
        '<span style="font-size:1.4rem">🎟</span>' +
        '<div>' +
          '<div style="font-weight:700;color:#1b5e20;font-size:.9rem">Абонемент активен — место бесплатно</div>' +
          '<div style="font-size:.8rem;color:#388e3c">Вы платите только за дополнительные услуги</div>' +
        '</div></div>'
      : '';

    return (
      '<input type="hidden" id="bk-date" value="' + today + '">' +
      subBanner +
      '<div class="bk-section">' +
      '<div class="bk-section-hd">' +
      '<span class="bk-section-title">Выбери дату</span>' +
      '<div class="bk-view-toggle">' +
      '<button type="button" class="bk-view-btn" id="bk-btn-cal"' +
      ' onclick="workplacesPage._switchBkView(\'calendar\')" title="Полный календарь">' +
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<rect x="1.5" y="3" width="13" height="12" rx="2"/>' +
      '<line x1="5" y1="1" x2="5" y2="5" stroke-linecap="round"/>' +
      '<line x1="11" y1="1" x2="11" y2="5" stroke-linecap="round"/>' +
      '<line x1="1.5" y1="7" x2="14.5" y2="7"/>' +
      '</svg>' +
      '</button>' +
      '<button type="button" class="bk-view-btn bk-view-btn--active" id="bk-btn-strip"' +
      ' onclick="workplacesPage._switchBkView(\'strip\')" title="Быстрый выбор">' +
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">' +
      '<rect x="1" y="1" width="6" height="6" rx="1.5"/>' +
      '<rect x="9" y="1" width="6" height="6" rx="1.5"/>' +
      '<rect x="1" y="9" width="6" height="6" rx="1.5"/>' +
      '<rect x="9" y="9" width="6" height="6" rx="1.5"/>' +
      '</svg>' +
      '</button></div></div>' +
      '<div id="bk-date-view" style="margin-top:10px"></div>' +
      '</div>' +
      '<div class="bk-section">' +
      '<span class="bk-section-title">Выбери время</span>' +
      '<div class="bk-time-card">' +
      '<div class="bk-time-cols">' +
      '<div class="bk-time-col">' +
      '<div class="bk-time-col__label">Приду в</div>' +
      '<div class="bk-time-scroll" id="bk-arrive-slots">' +
      '<div class="bk-slot-ph">Загрузка...</div>' +
      '</div></div>' +
      '<div class="bk-time-col">' +
      '<div class="bk-time-col__label">Уйду в</div>' +
      '<div class="bk-time-scroll" id="bk-leave-slots">' +
      '<div class="bk-slot-ph">Выберите время прихода</div>' +
      '</div></div>' +
      '</div>' +
      '<div id="bk-slot-info" class="slot-info"></div>' +
      '<input type="hidden" id="bk-slot-start">' +
      '<input type="hidden" id="bk-slot-end">' +
      '</div></div>' +
      (svcsHtml
        ? '<div class="bk-section"><span class="bk-section-title" style="font-size:1.15rem">Услуги</span>' + svcsHtml + '</div>'
        : '') +
      '<div class="bk-total" id="bk-total" style="display:none"></div>' +
      '<div id="bk-err" class="form-error" style="display:none"></div>'
    );
  },


  _ymd(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },



  _renderDateStrip(selected) {
    const view = document.getElementById('bk-date-view');
    if (!view) return;
    const base = new Date(); base.setHours(0,0,0,0);
    const D = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    let html = '<div class="bk-strip">';
    for (let i = 0; i < 14; i++) {
      const d  = new Date(base); d.setDate(base.getDate() + i);
      const ds = workplacesPage._ymd(d);
      html +=
        '<button type="button" class="bk-day-chip' + (ds === selected ? ' bk-day-chip--active' : '') + '"' +
        ' onclick="workplacesPage._selectBkDate(\'' + ds + '\')">' +
        '<span class="bk-day-name">' + D[d.getDay()] + '</span>' +
        '<span class="bk-day-num">'  + d.getDate()   + '</span>' +
        '</button>';
    }
    view.innerHTML = html + '</div>';
  },

  _renderCalendar(selected) {
    const view = document.getElementById('bk-date-view');
    if (!view) return;
    const yr   = workplacesPage._bkCalYear;
    const mo   = workplacesPage._bkCalMonth;
    const base = new Date(); base.setHours(0,0,0,0);
    const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const DAYS   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    const first  = new Date(yr, mo, 1);
    const last   = new Date(yr, mo + 1, 0);
    let dow = first.getDay(); if (dow === 0) dow = 6; else dow--;
    const selD   = new Date(selected + 'T00:00:00');
    const selTxt = selD.getDate() + ' ' + MONTHS[selD.getMonth()].toLowerCase() + ' ' + selD.getFullYear();
    let html =
      '<div class="bk-cal-selected">' + selTxt + '</div>' +
      '<div class="bk-calendar">' +
      '<div class="bk-cal-hd">' +
      '<span class="bk-cal-month">' + MONTHS[mo] + ' ▾</span>' +
      '<div class="bk-cal-navs">' +
      '<button type="button" class="bk-cal-nav" onclick="workplacesPage._calNav(-1)">‹</button>' +
      '<button type="button" class="bk-cal-nav" onclick="workplacesPage._calNav(1)">›</button>' +
      '</div></div>' +
      '<div class="bk-cal-grid">';
    DAYS.forEach(d => { html += '<div class="bk-cal-dow">' + d + '</div>'; });
    for (let i = 0; i < dow; i++) html += '<div></div>';
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(yr, mo, d);
      const ds   = workplacesPage._ymd(date);
      const past  = date < base;
      const today = date.getTime() === base.getTime();
      const active= ds === selected;
      let cls = 'bk-cal-day';
      if (past)             cls += ' bk-cal-day--past';
      if (today && !active) cls += ' bk-cal-day--today';
      if (active)           cls += ' bk-cal-day--active';
      const click = past ? '' : ' onclick="workplacesPage._selectBkDate(\'' + ds + '\')"';
      html += '<div class="' + cls + '"' + click + '>' + d + '</div>';
    }
    view.innerHTML = html + '</div></div>';
  },

  _switchBkView(v) {
    workplacesPage._bkView = v;
    document.getElementById('bk-btn-strip')?.classList.toggle('bk-view-btn--active', v === 'strip');
    document.getElementById('bk-btn-cal')?.classList.toggle('bk-view-btn--active',   v === 'calendar');
    if (v === 'strip') workplacesPage._renderDateStrip(workplacesPage._bkDate);
    else               workplacesPage._renderCalendar(workplacesPage._bkDate);
  },

  _calNav(dir) {
    let m = workplacesPage._bkCalMonth + dir;
    let y = workplacesPage._bkCalYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    workplacesPage._bkCalMonth = m;
    workplacesPage._bkCalYear  = y;
    workplacesPage._renderCalendar(workplacesPage._bkDate);
  },

  _selectBkDate(ds) {
    workplacesPage._bkDate      = ds;
    const _d = new Date(ds + 'T00:00:00');
    workplacesPage._bkCalYear   = _d.getFullYear();
    workplacesPage._bkCalMonth  = _d.getMonth();
    workplacesPage._bkArrival   = null;
    workplacesPage._bkDeparture = null;
    workplacesPage._slotState   = { start: null, end: null };

    const dateEl  = document.getElementById('bk-date');
    if (dateEl) dateEl.value = ds;
    const startEl = document.getElementById('bk-slot-start');
    const endEl   = document.getElementById('bk-slot-end');
    const info    = document.getElementById('bk-slot-info');
    const total   = document.getElementById('bk-total');
    if (startEl) startEl.value = '';
    if (endEl)   endEl.value   = '';
    if (info)    info.style.display  = 'none';
    if (total)   total.style.display = 'none';

    const arriveEl = document.getElementById('bk-arrive-slots');
    const leaveEl  = document.getElementById('bk-leave-slots');
    if (arriveEl) arriveEl.innerHTML = '<div class="bk-slot-ph">Загрузка...</div>';
    if (leaveEl)  leaveEl.innerHTML  = '<div class="bk-slot-ph">Выберите время прихода</div>';

    if (workplacesPage._bkView === 'strip') workplacesPage._renderDateStrip(ds);
    else                                    workplacesPage._renderCalendar(ds);

    workplacesPage._loadSlots(workplacesPage._bkWpId, ds);
  },



  _renderArrivalSlots(date) {
    const el = document.getElementById('bk-arrive-slots');
    if (!el) return;
    const HOURS  = [10,11,12,13,14,15,16,17,18,19,20];
    const taken  = workplacesPage._bkTakenHours;
    const isOS   = workplacesPage._bkWpType === 'OpenSpace';
    const cap    = workplacesPage._bkWpCap;
    const now    = new Date();
    const todStr = workplacesPage._ymd(now);
    const curH   = now.getHours();

    el.innerHTML = HOURS.map(h => {
      const past = date === todStr && h <= curH;
      const cnt  = taken[h] || 0;
      const full = isOS ? cnt >= cap : cnt >= 1;
      const active = h === workplacesPage._bkArrival;
      const lbl  = String(h).padStart(2,'0') + ':00';
      if (past || full) {
        return '<button type="button" class="bk-time-slot bk-time-slot--taken" disabled>' + lbl + '</button>';
      }
      return '<button type="button" class="bk-time-slot' + (active ? ' bk-time-slot--active' : '') + '"' +
        ' onclick="workplacesPage._selectArrival(' + h + ')">' + lbl + '</button>';
    }).join('');

    const firstFree = el.querySelector('.bk-time-slot:not(.bk-time-slot--taken)');
    if (firstFree) el.scrollTop = firstFree.offsetTop;
    else           el.scrollTop = 0;
  },

  _renderDepartureSlots() {
    const el  = document.getElementById('bk-leave-slots');
    if (!el) return;
    const arr = workplacesPage._bkArrival;
    if (arr === null) {
      el.innerHTML = '<div class="bk-slot-ph">Выберите время прихода</div>';
      return;
    }
    const taken = workplacesPage._bkTakenHours;
    const isOS  = workplacesPage._bkWpType === 'OpenSpace';
    const cap   = workplacesPage._bkWpCap;
    let html = '';
    for (let dep = arr + 1; dep <= 21; dep++) {
      let blocked = false;
      for (let h = arr; h < dep; h++) {
        const cnt = taken[h] || 0;
        if (isOS ? cnt >= cap : cnt >= 1) { blocked = true; break; }
      }
      const active = dep === workplacesPage._bkDeparture;
      const lbl    = String(dep).padStart(2,'0') + ':00';
      if (blocked) {
        html += '<button type="button" class="bk-time-slot bk-time-slot--taken" disabled>' + lbl + '</button>';
      } else {
        html += '<button type="button" class="bk-time-slot' + (active ? ' bk-time-slot--active' : '') + '"' +
          ' onclick="workplacesPage._selectDeparture(' + dep + ')">' + lbl + '</button>';
      }
    }
    el.innerHTML = html;
  },

  _selectArrival(h) {
    workplacesPage._bkArrival   = h;
    workplacesPage._bkDeparture = null;
    workplacesPage._slotState   = { start: null, end: null };
    const startEl  = document.getElementById('bk-slot-start');
    const endEl    = document.getElementById('bk-slot-end');
    const info     = document.getElementById('bk-slot-info');
    const totalEl  = document.getElementById('bk-total');
    if (startEl) startEl.value = '';
    if (endEl)   endEl.value   = '';
    if (info)    info.style.display  = 'none';
    if (totalEl) totalEl.style.display = 'none';
    workplacesPage._renderArrivalSlots(workplacesPage._bkDate);
    workplacesPage._renderDepartureSlots();
  },

  _selectDeparture(dep) {
    workplacesPage._bkDeparture = dep;
    const arr = workplacesPage._bkArrival;
    workplacesPage._slotState   = { start: arr, end: dep - 1 };
    const startEl = document.getElementById('bk-slot-start');
    const endEl   = document.getElementById('bk-slot-end');
    const info    = document.getElementById('bk-slot-info');
    if (startEl) startEl.value = arr;
    if (endEl)   endEl.value   = dep - 1;
    const hrs = dep - arr;
    if (info) {
      info.textContent = 'С ' + String(arr).padStart(2,'0') + ':00 до ' +
        String(dep).padStart(2,'0') + ':00' +
        ' (' + hrs + ' ' + (hrs === 1 ? 'час' : hrs < 5 ? 'часа' : 'часов') + ')';
      info.style.display = 'block';
    }
    workplacesPage._renderDepartureSlots();
    workplacesPage._updateTotal(workplacesPage._bkWp);
  },



  _buildServicesHtml() {
    const svcs = workplacesPage._services;
    if (!svcs.length) return '';

    function svcIcon(name) {
      const n = (name || '').toLowerCase();
      if (n.includes('печат') || n.includes('принт') || n.includes('print')) return '🖨️';
      if (n.includes('ноутбук') || n.includes('laptop') || n.includes('компьют')) return '💻';
      return '🛠️';
    }

    return '<div class="bk-svc-grid">' + svcs.map(s =>
      '<label class="bk-svc-card" id="bk-svc-lbl-' + s.id_service + '">' +
      '<input type="checkbox" class="svc-check" data-id="' + s.id_service +
      '" data-price="' + s.price + '" data-type="' + (s.pricingType || 'Flat') + '">' +
      '<input type="hidden" class="svc-qty" data-id="' + s.id_service + '" value="1">' +
      '<span class="bk-svc-card__icon">' + svcIcon(s.name) + '</span>' +
      '<span class="bk-svc-card__info">' +
      '<span class="bk-svc-card__name">' + esc(s.name) + '</span>' +
      '<span class="bk-svc-card__price">' + fmtMoney(s.price) +
      (s.pricingType === 'Hourly' ? '/ч' : ' ') + '</span>' +
      '</span>' +
      '<span class="bk-svc-card__check"></span>' +
      '</label>'
    ).join('') + '</div>';
  },

  _onSvcChange(w) {
    workplacesPage._selSvcs = {};
    document.querySelectorAll('.svc-check:checked').forEach(cb => {
      const id  = parseInt(cb.dataset.id);
      const qty = parseInt(document.querySelector('.svc-qty[data-id="' + id + '"]')?.value) || 1;
      workplacesPage._selSvcs[id] = qty;
    });
    workplacesPage._updateTotal(w);
  },

  _updateTotal(w) {
    const state   = workplacesPage._slotState;
    const totalEl = document.getElementById('bk-total');
    if (!totalEl) return;
    if (state.start === null) { totalEl.style.display = 'none'; return; }

    const hasSub = workplacesPage._subActive;
    const lo     = state.end !== null ? Math.min(state.start, state.end) : state.start;
    const hi     = state.end !== null ? Math.max(state.start, state.end) : state.start;
    const hours  = hi - lo + 1;
    const rate   = w?.pricePerHour || 0;


    let total = hasSub ? 0 : hours * rate;
    const lines = [];

    if (hasSub) {
      lines.push('🎟 ' + hours + ' ч × ' + fmtMoney(rate) + ' = <span style="color:#2d6a2d;font-weight:700">Бесплатно (абонемент)</span>');
    } else if (rate) {
      lines.push(hours + ' ч × ' + fmtMoney(rate) + ' = ' + fmtMoney(hours * rate));
    }

    document.querySelectorAll('.svc-check:checked').forEach(cb => {
      const id    = parseInt(cb.dataset.id);
      const price = parseFloat(cb.dataset.price) || 0;
      const type  = cb.dataset.type;
      const qty   = parseInt(document.querySelector('.svc-qty[data-id="' + id + '"]')?.value) || 1;
      const svc   = workplacesPage._services.find(s => s.id_service === id);
      const name  = svc?.name || 'Услуга';
      if (type === 'Hourly') {
        const cost = hours * price * qty;
        total += cost;
        lines.push(esc(name) + ' ' + hours + ' ч × ' + fmtMoney(price) + ' = ' + fmtMoney(cost));
      } else {
        const cost = price * qty;
        total += cost;
        lines.push(esc(name) + ' ' +  fmtMoney(price) + ' = ' + fmtMoney(cost));
      }
    });

    totalEl.style.display = 'block';
    totalEl.innerHTML =
      '<div class="bk-total__lines">' + lines.map(l => '<div>' + l + '</div>').join('') + '</div>' +
      '<div class="bk-total__sum">Итого: <strong>' + fmtMoney(total) + '</strong>' +
      (hasSub && total === 0 ? ' <span style="color:#2d6a2d;font-size:.82rem">(место покрыто абонементом)</span>' : '') +
      '</div>';
  },



  async _loadSlots(wpId, date) {
    const HOURS = [10,11,12,13,14,15,16,17,18,19,20];
    const hourCounts = {};
    HOURS.forEach(h => { hourCounts[h] = 0; });
    let wpType   = 'Room';
    let capacity = 1;

    try {
      const av = await apiBooking.availability(wpId);
      wpType   = av.type     || 'Room';
      capacity = av.capacity || 1;
      (Array.isArray(av.bookings) ? av.bookings : []).forEach(b => {
        const s     = new Date(b.startDate);
        const e     = new Date(b.endDate);
        const bDate = workplacesPage._ymd(s);
        if (bDate === date) {
          for (let h = s.getHours(); h < e.getHours(); h++) {
            if (h in hourCounts) hourCounts[h]++;
          }
        }
      });
    } catch {}

    
    if (document.getElementById('bk-arrive-slots')) {
      if (date !== workplacesPage._bkDate) return;
      workplacesPage._bkTakenHours = hourCounts;
      workplacesPage._bkWpType     = wpType;
      workplacesPage._bkWpCap      = capacity;
      workplacesPage._renderArrivalSlots(date);
      workplacesPage._renderDepartureSlots();
      return;
    }


    const grid = document.getElementById('bk-slots');
    if (!grid) return;
    const now         = new Date();
    const todayStr    = workplacesPage._ymd(now);
    const currentHour = now.getHours();
    const isOpenSpace = wpType === 'OpenSpace';

    grid.innerHTML = HOURS.map(h => {
      const label  = String(h).padStart(2,'0') + ':00';
      const isPast = date === todayStr && h <= currentHour;
      const count  = hourCounts[h];
      const isFull = isOpenSpace ? count >= capacity : count >= 1;
      if (isPast || isFull) {
        let note = '';
        if (isFull && isOpenSpace) note = '<span class="slot-note">нет мест</span>';
        else if (isFull)           note = ' ✗';
        return '<button type="button" class="slot-btn slot-btn--taken" disabled data-hour="' + h + '">' +
          label + note + '</button>';
      }
      let noteHtml = '';
      if (isOpenSpace && count > 0) {
        noteHtml = '<span class="slot-note">' + (capacity - count) + ' из ' + capacity + '</span>';
      }
      return '<button type="button" class="slot-btn" data-hour="' + h + '" ' +
        'onclick="workplacesPage._selectSlot(' + h + ', this)">' + label + noteHtml + '</button>';
    }).join('');
  },


  _selectSlot(hour, btn) {
    const state = workplacesPage._slotState;
    if (state.start !== null && state.end === null) {
      const lo = Math.min(state.start, hour);
      const hi = Math.max(state.start, hour);
      let blocked = false;
      document.querySelectorAll('#bk-slots .slot-btn--taken').forEach(b => {
        const h = parseInt(b.dataset.hour);
        if (h > lo && h <= hi) blocked = true;
      });
      if (blocked || hour === state.start) { state.start = hour; state.end = null; }
      else { state.start = Math.min(state.start, hour); state.end = Math.max(state.start, hour); }
    } else {
      state.start = hour; state.end = null;
    }
    workplacesPage._updateSlotDisplay();
  },

  _updateSlotDisplay() {
    const state   = workplacesPage._slotState;
    const info    = document.getElementById('bk-slot-info');
    const startEl = document.getElementById('bk-slot-start');
    const endEl   = document.getElementById('bk-slot-end');
    document.querySelectorAll('#bk-slots .slot-btn:not(.slot-btn--taken)').forEach(b => {
      const h = parseInt(b.dataset.hour);
      b.classList.remove('slot-btn--start','slot-btn--end','slot-btn--range');
      if (state.start === null) return;
      const lo = state.end !== null ? Math.min(state.start,state.end) : state.start;
      const hi = state.end !== null ? Math.max(state.start,state.end) : state.start;
      if      (h === lo && h === hi) b.classList.add('slot-btn--start','slot-btn--end');
      else if (h === lo)             b.classList.add('slot-btn--start');
      else if (h === hi)             b.classList.add('slot-btn--end');
      else if (h > lo && h < hi)    b.classList.add('slot-btn--range');
    });
    if (state.start !== null) {
      const lo    = state.end !== null ? Math.min(state.start,state.end) : state.start;
      const hi    = state.end !== null ? Math.max(state.start,state.end) : state.start;
      const hours = hi - lo + 1;
      if (startEl) startEl.value = lo;
      if (endEl)   endEl.value   = hi;
      if (info) {
        info.textContent = 'С ' + String(lo).padStart(2,'0') + ':00 до ' + String(hi+1).padStart(2,'0') + ':00' +
          ' (' + hours + ' ' + (hours===1?'час':hours<5?'часа':'часов') + ')';
        info.style.display = 'block';
      }
      const wpId = parseInt(document.querySelector('[onclick*="submitBooking"]')?.getAttribute('onclick')?.match(/\d+/)?.[0]);
      const w = workplacesPage._data.find(x => x.id_workplace === wpId)
             || workplacesPage._bkAdminWp || null;
      if (w) workplacesPage._updateTotal(w);
    } else {
      if (startEl) startEl.value = '';
      if (endEl)   endEl.value   = '';
      if (info)    info.style.display = 'none';
    }
  },

  async submitBooking(wpId) {
    const date     = document.getElementById('bk-date')?.value || workplacesPage._bkDate;
    const startVal = document.getElementById('bk-slot-start')?.value;
    const endVal   = document.getElementById('bk-slot-end')?.value;
    const errEl    = document.getElementById('bk-err');

    if (!date || startVal === '' || endVal === '') {
      errEl.textContent = 'Выберите дату, время прихода и ухода';
      errEl.style.display = 'block'; return;
    }
    errEl.style.display = 'none';

    const startHour  = parseInt(startVal);
    const endHour    = parseInt(endVal);
    const startLocal = new Date(date + 'T' + String(startHour).padStart(2,'0') + ':00:00');
    const endLocal   = new Date(date + 'T' + String(endHour + 1).padStart(2,'0') + ':00:00');

    const services = Object.entries(workplacesPage._selSvcs).map(([id, qty]) => ({
      id_service: parseInt(id), quantity: qty,
    }));

    let u = Auth.get();
    if (!u?.clientId && u?.id) {
      try {
        const res = await fetch(API_BASE + '/user/' + u.id, {
          headers: { 'Authorization': 'Bearer ' + Auth.token() }
        });
        if (res.ok) {
          const ud  = await res.json();
          const cid = ud?.id_client || ud?.clientId || ud?.client?.id || ud?.client?.id_client || null;
          if (cid) {
            const stored = Auth.get();
            stored.clientId = cid;
            localStorage.setItem('kw_user', JSON.stringify(stored));
            u = Auth.get();
          }
        }
      } catch {}
    }

    const body = {
      id_workPlace: wpId,
      startDate:    startLocal.toISOString(),
      endDate:      endLocal.toISOString(),
    };
    if (u?.clientId)    body.id_client = u.clientId;
    if (services.length) body.services  = services;

    try {
      await apiBooking.create(body);
      toastOk('Бронирование создано — ожидайте подтверждения');
      closeModal('modal-book');
      await workplacesPage._load();
    } catch (e) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  },
};