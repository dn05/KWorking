/* ═══════════════════════════════════════════════════════════
   УТИЛИТЫ
═══════════════════════════════════════════════════════════ */

function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast toast--show' + (type ? ' toast--' + type : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}
function toastOk(msg)  { showToast(msg, 'ok'); }
function toastErr(msg) { showToast(msg, 'err'); }

/* Форматирование */
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit'
    });
}
function fmtMoney(v) {
    return Number(v).toLocaleString('ru-RU', {
        style:'currency', currency:'RUB', maximumFractionDigits:0
    });
}

/* Карты статусов */
const BOOK_STATUS = {
    PendingConfirmation: ['Ожидает',  'badge--yellow'],
    Active:              ['Активно',  'badge--green'],
    Cancelled:           ['Отменено', 'badge--red'],
    Completed:           ['Завершено','badge--gray'],
};
const PAY_STATUS = {
    Pending:   ['Не оплачено','badge--yellow'],
    Paid:      ['Оплачено',   'badge--green'],
    Cancelled: ['Отменено',   'badge--red'],
};
const WP_STATUS = {
    free:   ['Свободно',      'badge--green'],
    booked: ['Забронировано', 'badge--yellow'],
    busy:   ['Занято',        'badge--red'],
};
const ROLE_LABELS = {
    Client:'Клиент', Employee:'Сотрудник', Cashier:'Кассир',
    Administrator:'Администратор', SuperAdmin:'Суперадмин'
};

function badge(map, key) {
    const v = map[key] || [key, 'badge--gray'];
    return '<span class="badge ' + v[1] + '">' + v[0] + '</span>';
}

/* Телефонный ввод: +7 + ровно 10 цифр, буквы запрещены */
document.addEventListener('focusin', e => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'tel' && !e.target.value)
        e.target.value = '+7';
});
document.addEventListener('input', e => {
    if (e.target.tagName !== 'INPUT' || e.target.type !== 'tel') return;
    let v = e.target.value;
    if (!v.startsWith('+7')) v = '+7' + v.replace(/^\+?8?7?/, '');
    const digits = v.slice(2).replace(/\D/g, '').slice(0, 10);
    e.target.value = '+7' + digits;
    const phoneErr = e.target.closest('.form-group')?.querySelector('.phone-err');
    if (phoneErr) phoneErr.style.display = 'none';
});
document.addEventListener('keydown', e => {
    if (e.target.tagName !== 'INPUT' || e.target.type !== 'tel') return;
    const el = e.target;
    if ((e.key === 'Backspace' || e.key === 'Delete') && el.value.length <= 2)
        e.preventDefault();
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const phoneErr = el.closest('.form-group')?.querySelector('.phone-err');
        if (phoneErr) {
            phoneErr.style.display = 'block';
            clearTimeout(phoneErr._t);
            phoneErr._t = setTimeout(() => { phoneErr.style.display = 'none'; }, 2000);
        }
    }
});

/* Экранирование HTML */
function esc(s) {
    if (!s && s !== 0) return '';
    return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Модальные окна */
function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
function buildModal(id, title, bodyHtml, footerHtml, wide) {
    const old = document.getElementById(id);
    if (old) old.remove();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'modal-overlay';
    div.innerHTML =
        '<div class="modal' + (wide ? ' modal-lg' : '') + '">' +
            '<div class="modal__hd"><h3>' + esc(title) + '</h3>' +
            '<button class="modal__close" onclick="closeModal(\'' + id + '\')">×</button></div>' +
            '<div class="modal__body">' + bodyHtml + '</div>' +
            (footerHtml ? '<div class="modal__ft">' + footerHtml + '</div>' : '') +
        '</div>';
    div.addEventListener('click', e => { if (e.target === div) closeModal(id); });
    document.body.appendChild(div);
}

/* Дата/время */
function nowLocal() {
    const d = new Date(); d.setSeconds(0,0);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off*60000).toISOString().slice(0,16);
}
function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso); d.setSeconds(0,0);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off*60000).toISOString().slice(0,16);
}
function fromLocalInput(val) {
    if (!val) return null;
    return new Date(val).toISOString();
}
