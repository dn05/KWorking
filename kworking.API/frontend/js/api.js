const API_BASE = 'http://localhost:5175/api';

async function req(method, path, body, auth) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = localStorage.getItem('kw_token');
        if (!token) { App.logout(); throw new Error('Не авторизован'); }
        headers['Authorization'] = 'Bearer ' + token;
    }

    const opts = { method, headers };
    if (body !== undefined && body !== null) opts.body = JSON.stringify(body);

    let res;
    try {
        res = await fetch(API_BASE + path, opts);
    } catch (e) {
        throw new Error('Сервер недоступен. Проверьте, запущен ли бэкенд.');
    }

    if (res.status === 401) {
        if (!path.startsWith('/auth/')) {
            App.logout();
        }
        const text401 = await res.text();
        throw new Error(text401 || 'Неверный логин или пароль');
    }
    if (res.status === 204) return null;

    const text = await res.text();
    if (!res.ok) {
        let msg = text || 'Ошибка ' + res.status;
        try { const p = JSON.parse(text); if (typeof p === 'string') msg = p; } catch {}
        throw new Error(msg);
    }

    try { return JSON.parse(text); } catch { return text; }
}

/* Вспомогательные методы */
const G  = (p,a)    => req('GET',    p, null, a);
const P  = (p,b,a)  => req('POST',   p, b,    a);
const PT = (p,b,a)  => req('PUT',    p, b,    a);
const PA = (p,b,a)  => req('PATCH',  p, b,    a);
const D  = (p,a)    => req('DELETE', p, null, a);

/* ─── AUTH ──────────────────────────────────────────────── */
const apiAuth = {
    login:         d => P('/auth/login',          d, false),
    register:      d => P('/auth/register',       d, false),
    resetPassword: d => P('/auth/reset-password', d, false),
};

/* ─── РАБОЧИЕ МЕСТА ──────────────────────────────────────── */
const apiWorkplace = {
    getAll:  ()    => G('/workplace',                 true),
    getFree: ()    => G('/workplace/free',            true),
    getById: id    => G('/workplace/'+id,             true),
    create:  d     => P('/workplace', d,              true),
    update:  (id,d)=> PT('/workplace/'+id, d,         true),
    delete:  id    => D('/workplace/'+id,             true),
    status:  (id,s)=> PA('/workplace/'+id+'/status?status='+s, null, true),
};

/* ─── БРОНИРОВАНИЯ ────────────────────────────────────────── */
const apiBooking = {
    getAll:   (p,ps) => G('/booking?page='+(p||1)+'&pageSize='+(ps||20), true),
    getById:  id     => G('/booking/'+id,         true),
    create:   d      => P('/booking', d,          true),
    update:   (id,d) => PT('/booking/'+id, d,     true),
    confirm:  id     => PA('/booking/'+id+'/confirm', null, true),
    cancel:   id     => PA('/booking/'+id+'/cancel',  null, true),
    complete: id     => PA('/booking/'+id+'/complete', null, true),
    pending:  ()     => G('/booking/pending',     true),
    active:   ()     => G('/booking/active',      true),
    byClient:     cid   => G('/booking/client/'+cid,    true),
    byWorkplace:  wpId  => G('/booking/workplace/'+wpId, true),
    availability: wpId  => G('/booking/availability?workplaceId='+wpId, true),
};

/* ─── ТАРИФЫ ─────────────────────────────────────────────── */
const apiTariff = {
    getAll:  ()    => G('/tariff',        false),
    getById: id    => G('/tariff/'+id,    false),
    create:  d     => P('/tariff', d,     true),
    update:  (id,d)=> PT('/tariff/'+id,d, true),
    delete:  id    => D('/tariff/'+id,    true),
};

/* ─── КЛИЕНТЫ ────────────────────────────────────────────── */
const apiClient = {
    getAll:  (p,ps) => G('/client?page='+(p||1)+'&pageSize='+(ps||50), true),
    getById: id     => G('/client/'+id,           true),
    create:  d      => P('/client', d,            true),
    update:  (id,d) => PT('/client/'+id, d,       true),
    delete:  id     => D('/client/'+id,           true),
    search:  q      => G('/client/search?'+new URLSearchParams(q), true),
};

/* ─── ПОЛЬЗОВАТЕЛИ ───────────────────────────────────────── */
const apiUser = {
    getAll:  ()    => G('/user',             true),
    getById: id    => G('/user/'+id,         true),
    create:  d     => P('/user', d,          true),
    update:  (id,d)=> PT('/user/'+id, d,     true),
    delete:  id    => D('/user/'+id,         true),
    setRole: (id,r)=> PA('/user/'+id+'/role?role='+r, null, true),
};

/* ─── УСЛУГИ ─────────────────────────────────────────────── */
const apiService = {
    getAll:  ()     => G('/service',        true),
    create:  d      => P('/service', d,     true),
    update:  (id,d) => PT('/service/'+id,d, true),
    delete:  id     => D('/service/'+id,    true),
};

/* ─── АБОНЕМЕНТЫ ─────────────────────────────────────────── */
const apiSubscription = {
    getAll:   ()  => G('/subscription',              true),
    getMine:  ()  => G('/subscription/my',           true),
    create:   d   => P('/subscription', d,           true),
    activate: id  => PA('/subscription/'+id+'/activate', null, true),
    cancel:   id  => PA('/subscription/'+id+'/cancel',   null, true),
};

/* ─── ПЛАТЕЖИ ─────────────────────────────────────────────── */
const apiPayment = {
    getAll:    (p,ps) => G('/payment?page='+(p||1)+'&pageSize='+(ps||20), true),
    getById:   id     => G('/payment/'+id,               true),
    create:    d      => P('/payment', d,                true),
    pay:       id     => PA('/payment/'+id+'/pay',  null, true),
    cancel:    id     => PA('/payment/'+id+'/cancel', null, true),
    byBooking: bid    => G('/payment/booking/'+bid,      true),
    debts:     ()     => G('/payment/debt',              true),
    report:    (s,e)  => G('/payment/report'+(s?'?startDate='+s+(e?'&endDate='+e:''):''), true),
    stats:     (p)    => G('/payment/stats?period='+(p||'week'), true),
};
