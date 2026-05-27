
const Auth = {
    save(data) {
        localStorage.setItem('kw_token', data.token);
        localStorage.setItem('kw_user', JSON.stringify({
            id:         data.id_user,
            login:      data.login,
            role:       data.role,
            clientId:   data.id_client || data.clientId || data.client?.id || data.client?.id_client || null,
            clientName: data.clientName || null,
            email:      data.email      || null,
            phone:      data.phone      || null,
        }));
    },

    get() {
        try { return JSON.parse(localStorage.getItem('kw_user')); } catch { return null; }
    },

    token() { return localStorage.getItem('kw_token'); },

    isLoggedIn() { return !!this.token(); },

    isAdmin()  { const r = this.get()?.role; return r === 'Administrator' || r === 'SuperAdmin'; },
    isSuper()  { return this.get()?.role === 'SuperAdmin'; },
    isClient() { return this.get()?.role === 'Client'; },
    isStaff()  { const r = this.get()?.role; return ['Employee','Cashier','Administrator','SuperAdmin'].includes(r); },
    isCashier(){ const r = this.get()?.role; return ['Cashier','Administrator','SuperAdmin'].includes(r); },

    clear() {
        localStorage.removeItem('kw_token');
        localStorage.removeItem('kw_user');
    },
};


function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn   = form.querySelector('button[type=submit]');
        const errEl = document.getElementById('login-error');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Вхожу…';

        try {
            const data = await apiAuth.login({
                login:    document.getElementById('inp-login').value.trim(),
                password: document.getElementById('inp-login-pass').value,
            });
            Auth.save(data);
            App.afterLogin();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Войти';
        }
    });
}


function initForgotPassword() {
    document.getElementById('btn-forgot-pass')?.addEventListener('click', e => {
        e.preventDefault();
        buildModal('modal-forgot', 'Сброс пароля',
            '<p style="color:var(--muted);font-size:.875rem;margin-bottom:16px">' +
            'Введите логин и новый пароль. После сохранения войдите с новым паролем.</p>' +
            '<div class="form-group"><label class="form-label">Логин</label>' +
            '<input class="form-input" id="fp-login" placeholder="Ваш логин" autocomplete="username"></div>' +
            '<div class="form-group"><label class="form-label">Новый пароль</label>' +
            '<input class="form-input" type="password" id="fp-pass" placeholder="Новый пароль" autocomplete="new-password"></div>' +
            '<div class="form-group"><label class="form-label">Повторите пароль</label>' +
            '<input class="form-input" type="password" id="fp-pass2" placeholder="Повторите пароль" autocomplete="new-password"></div>' +
            '<div id="fp-err" class="form-error" style="display:none"></div>',
            '<button class="btn btn--ghost" onclick="closeModal(\'modal-forgot\')">Отмена</button>' +
            '<button class="btn btn--accent" id="fp-submit">Сохранить</button>');
        openModal('modal-forgot');

        document.getElementById('fp-submit')?.addEventListener('click', async () => {
            const login = document.getElementById('fp-login')?.value.trim();
            const pass  = document.getElementById('fp-pass')?.value;
            const pass2 = document.getElementById('fp-pass2')?.value;
            const errEl = document.getElementById('fp-err');
            if (!login) { errEl.textContent = 'Введите логин'; errEl.style.display = 'block'; return; }
            if (!pass)  { errEl.textContent = 'Введите новый пароль'; errEl.style.display = 'block'; return; }
            if (pass !== pass2) { errEl.textContent = 'Пароли не совпадают'; errEl.style.display = 'block'; return; }
            errEl.style.display = 'none';
            try {
                await apiAuth.resetPassword({ login, newPassword: pass });
                closeModal('modal-forgot');
                toastOk('Пароль изменён — войдите с новым паролем');
            } catch(err) {
                errEl.textContent = err.message;
                errEl.style.display = 'block';
            }
        });
    });
}


function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn   = form.querySelector('button[type=submit]');
        const errEl = document.getElementById('register-error');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Регистрирую…';

        try {
            const regEmail = document.getElementById('inp-reg-email').value.trim();
            const regPhone = document.getElementById('inp-reg-phone').value.trim();
            const regName  = document.getElementById('inp-reg-name').value.trim();
            const regSurn  = document.getElementById('inp-reg-surname').value.trim();
            const data = await apiAuth.register({
                login:    document.getElementById('inp-reg-login').value.trim(),
                password: document.getElementById('inp-reg-pass').value,
                name:     regName,
                surname:  regSurn,
                email:    regEmail,
                phone:    regPhone,
            });
            
            if (!data.email)      data.email      = regEmail;
            if (!data.phone)      data.phone      = regPhone;
            if (!data.clientName) data.clientName = (regName + ' ' + regSurn).trim();
            Auth.save(data);
            App.afterLogin();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Зарегистрироваться';
        }
    });
}
