
const dashboardPage = {
    _chart: null,
    currentPeriod: 'week',

    async render() {
        const u    = Auth.get();
        const name = u?.clientName || u?.login || '';
        const role = ROLE_LABELS[u?.role] || u?.role || '';
        const showChart = Auth.isCashier() || Auth.isAdmin() || Auth.isSuper();

        document.getElementById('page-content').innerHTML =
            '<div class="page-hd"><div><h2>Добро пожаловать, ' + esc(name) + '!</h2>' +
            '<p style="color:var(--muted);margin-top:2px">' + esc(role) + '</p></div></div>' +
            '<div class="stats-grid" id="dash-stats">' +
            '<div class="stat-card"><div class="stat-card__icon">⏳</div>' +
            '<div class="stat-card__value" id="ds-pending">…</div>' +
            '<div class="stat-card__label">Ожидают подтверждения</div></div>' +
            '<div class="stat-card"><div class="stat-card__icon">✅</div>' +
            '<div class="stat-card__value" id="ds-active">…</div>' +
            '<div class="stat-card__label">Активных бронирований</div></div>' +
            (showChart ?
            '<div class="stat-card"><div class="stat-card__icon">💰</div>' +
            '<div class="stat-card__value" id="ds-revenue">…</div>' +
            '<div class="stat-card__label" id="ds-revenue-label">Выручка за неделю</div></div>' : '') +
            '</div>' +

            (Auth.isClient() ? '<div id="dash-sub-block" style="margin-top:20px"></div>' : '') +

            (showChart ? `
            <div class="chart-section">
                <div class="chart-section__hd">
                    <h3 class="chart-section__title">Выручка</h3>
                    <div class="chart-tabs" id="chart-tabs">
                        <button class="chart-tab" data-period="day">День</button>
                        <button class="chart-tab chart-tab--active" data-period="week">Неделя</button>
                        <button class="chart-tab" data-period="month">Месяц</button>
                        <button class="chart-tab" data-period="custom">Период ▾</button>
                    </div>
                </div>
                <div class="chart-custom" id="chart-custom" style="display:none">
                    <input class="form-input" type="date" id="chart-start" style="max-width:160px">
                    <span style="color:var(--muted);padding:0 8px">—</span>
                    <input class="form-input" type="date" id="chart-end" style="max-width:160px">
                    <button class="btn btn--accent btn--sm" onclick="dashboardPage.loadChart('custom')">Показать</button>
                </div>
                <div class="chart-wrap"><canvas id="revenue-chart"></canvas></div>
            </div>` : '') +

            '<div class="page-hd" style="margin-top:8px"><h3 style="font-size:1.1rem;font-weight:600">Быстрые действия</h3></div>' +
            '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
            '<button class="btn btn--accent" data-nav="workplaces">Рабочие места</button>' +
            '<button class="btn btn--ghost" data-nav="bookings">Бронирования</button>' +
            '</div>';

        this.loadStats();
        if (Auth.isClient()) this.loadSubscription();

        if (showChart) {
            this.setupChartTabs();
            this.loadChart('week');
        }
    },

    setupChartTabs() {
        const tabs = document.getElementById('chart-tabs');
        if (!tabs) return;

        tabs.addEventListener('click', async (e) => {
            const tab = e.target.closest('.chart-tab');
            if (!tab) return;

            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('chart-tab--active'));
            tab.classList.add('chart-tab--active');

            const period = tab.dataset.period;
            const customEl = document.getElementById('chart-custom');
            if (customEl) customEl.style.display = (period === 'custom') ? 'flex' : 'none';

            this.currentPeriod = period;
            if (period !== 'custom') {
                await this.loadStats();
                await this.loadChart(period);
            }
        });
    },

    async loadStats() {
        try {
            if (Auth.isClient()) {
                const u   = Auth.get();
                const bks = await apiBooking.byClient(u.clientId || u.id_client);
                const arr = Array.isArray(bks) ? bks : [];
                document.getElementById('ds-pending').textContent = arr.filter(b => b.status === 'PendingConfirmation').length;
                document.getElementById('ds-active').textContent  = arr.filter(b => b.status === 'Active').length;
                return;
            }

            const [pend, act] = await Promise.allSettled([apiBooking.pending(), apiBooking.active()]);
            document.getElementById('ds-pending').textContent = pend.status==='fulfilled' ? (Array.isArray(pend.value)?pend.value.length:0) : 0;
            document.getElementById('ds-active').textContent  = act.status==='fulfilled'  ? (Array.isArray(act.value)?act.value.length:0)  : 0;

           
            const revenueEl = document.getElementById('ds-revenue');
            const labelEl   = document.getElementById('ds-revenue-label');

            let total = 0;

            if (this.currentPeriod === 'custom') {
                const start = document.getElementById('chart-start')?.value;
                const end   = document.getElementById('chart-end')?.value;
                if (start && end) {
                    try {
                        const report = await apiPayment.report(start, end + 'T23:59:59');
                        const payments = dashboardPage._extractPayments(report);
                        total = payments.reduce((sum, p) => sum + dashboardPage._extractPrice(p), 0);
                    } catch {}
                }
            } else {
                try {
                    const stats = await apiPayment.stats(this.currentPeriod);
                    total = dashboardPage._extractTotal(stats);
                } catch {}
            }

            if (revenueEl) revenueEl.textContent = fmtMoney(total);
            if (labelEl)   labelEl.textContent   = 'Выручка за ' + this.getPeriodLabel();

        } catch(e) {
            console.warn('loadStats error:', e.message);
        }
    },

    getPeriodLabel() {
        switch(this.currentPeriod) {
            case 'day':    return 'день';
            case 'week':   return 'неделю';
            case 'month':  return 'месяц';
            default:       return 'период';
        }
    },

   
    
    
    _extractPayments(report) {
        if (!report) return [];
        
        if (Array.isArray(report.payments))  return report.payments;
        if (Array.isArray(report.Payments))  return report.Payments;
        
        if (Array.isArray(report))           return report;
        
        if (Array.isArray(report.data))      return report.data;
        return [];
    },

    
    _extractPrice(p) {
        return parseFloat(p?.price ?? p?.Price ?? p?.amount ?? p?.Amount ?? 0) || 0;
    },

    
    _extractDateKey(p) {
        const raw = p?.paymentDate || p?.PaymentDate || p?.date || p?.Date || p?.createdAt || p?.CreatedAt;
        if (!raw) return null;
        try {
            return new Date(raw).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        } catch { return null; }
    },

    
    _extractTotal(stats) {
        if (!stats) return 0;
        const t = stats.TotalAmount ?? stats.totalAmount ?? stats.total ?? stats.Total ?? null;
        if (t !== null) return parseFloat(t) || 0;
        if (Array.isArray(stats.data)) return stats.data.reduce((s, v) => s + (parseFloat(v)||0), 0);
        if (Array.isArray(stats))      return stats.reduce((s, p) => s + dashboardPage._extractPrice(p), 0);
        return 0;
    },

    
    

    async loadChart(period = null) {
        if (period) this.currentPeriod = period;

        let labels = [], dataPoints = [];

        try {
            if (this.currentPeriod === 'custom') {
                const start = document.getElementById('chart-start')?.value;
                const end   = document.getElementById('chart-end')?.value;
                if (!start || !end) return;

                const endInclusive = end + 'T23:59:59';
                const report = await apiPayment.report(start, endInclusive);
                const payments = dashboardPage._extractPayments(report);

                
                const total     = payments.reduce((sum, p) => sum + dashboardPage._extractPrice(p), 0);
                const revenueEl = document.getElementById('ds-revenue');
                const labelEl   = document.getElementById('ds-revenue-label');
                if (revenueEl) revenueEl.textContent = fmtMoney(total);
                if (labelEl)   labelEl.textContent   = 'Выручка за период';

               
                const map = {};
                payments.forEach(p => {
                    const key = dashboardPage._extractDateKey(p);
                    if (key) map[key] = (map[key] || 0) + dashboardPage._extractPrice(p);
                });

                
                if (Object.keys(map).length === 0 && total > 0) {
                    labels     = ['Итого'];
                    dataPoints = [total];
                } else {
                    labels     = Object.keys(map).sort();
                    dataPoints = labels.map(k => map[k]);
                }

            } else {
               
                const res = await apiPayment.stats(this.currentPeriod);

                if (Array.isArray(res?.labels) && res.labels.length) {
                    labels     = res.labels;
                    dataPoints = Array.isArray(res.data) ? res.data : [];
                } else if (Array.isArray(res)) {
                    
                    const map = {};
                    res.forEach(p => {
                        const key = dashboardPage._extractDateKey(p);
                        if (key) map[key] = (map[key] || 0) + dashboardPage._extractPrice(p);
                    });
                    labels     = Object.keys(map).sort();
                    dataPoints = labels.map(k => map[k]);
                } else if (Array.isArray(res?.data) && !Array.isArray(res.labels)) {
                    
                    dataPoints = res.data;
                    labels     = dataPoints.map((_, i) => String(i + 1));
                }
            }
        } catch(e) {
            console.warn('chart data error:', e.message);
        }

        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;

        if (this._chart) { this._chart.destroy(); this._chart = null; }

        
        const isEmpty = !labels.length || dataPoints.every(v => !v);

        this._chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels:   isEmpty ? ['Нет данных'] : labels,
                datasets: [{
                    label: 'Выручка',
                    data:  isEmpty ? [0] : dataPoints,
                    backgroundColor: isEmpty ? '#e0dbd0' : '#80744C',
                    borderColor:     isEmpty ? '#c8c2b4' : '#6b5a3d',
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ' ' + Number(ctx.parsed.y).toLocaleString('ru-RU') + ' ₽'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => Number(v).toLocaleString('ru-RU') + ' ₽' }
                    }
                }
            }
        });
    },

    async loadSubscription() {
        const block = document.getElementById('dash-sub-block');
        if (!block) return;
        try {
            const sub = await apiSubscription.getMine().catch(() => null);
            if (sub && sub.status === 'Active') {
                const until = sub.endDate
                    ? new Date(sub.endDate.slice(0, 10) + 'T12:00:00')
                        .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—';
                block.innerHTML =
                    '<div class="sub-card sub-card--active"><div class="sub-card__icon">⭐</div>' +
                    '<div><div class="sub-card__title">Абонемент активен</div>' +
                    '<div class="sub-card__desc">Действует до ' + until + ' — рабочие места бесплатно</div></div></div>';
            } else {
                block.innerHTML = '';
            }
        } catch { block.innerHTML = ''; }
    },
};