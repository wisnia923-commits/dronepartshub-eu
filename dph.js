/* dronepartshub.eu – wysyłka formularzy do Bitrix24 (/api/lead) i czat AI do szukania części (/api/chat). */
(function () {
  var S = function () { try { return typeof STATE !== 'undefined' ? STATE : null; } catch (e) { return null; } };
  var L = function () { try { return (S() && S().lang) || localStorage.getItem('dji_lang') || 'pl'; } catch (e) { return 'pl'; } };
  var TX = {
    pl: { title: 'Szukaj części', hello: 'Cześć! Podaj model drona (T25P, T50, T100) i nazwę części albo numer katalogowy, np. „pompa T50” lub „YC.JG.ZS001730”.', ph: 'Model, nazwa lub numer części…', send: 'Wyślij', add: 'Do koszyka', open: 'Szczegóły', err: 'Coś poszło nie tak. Spróbuj ponownie albo napisz na order@dronepartshub.eu.', note: 'Nie wpisuj tu danych osobowych. Czat odpowiada automatycznie (AI) na podstawie katalogu.', contact: 'Formularz kontaktowy', stock: 'na stanie', nostock: 'na zamówienie', btn: 'Szukaj części z AI' },
    ua: { title: 'Пошук запчастин', hello: 'Вітаю! Вкажіть модель дрона (T25P, T50, T100) і назву деталі або каталожний номер, напр. «насос T50» або «YC.JG.ZS001730».', ph: 'Модель, назва або номер…', send: 'Надіслати', add: 'У кошик', open: 'Деталі', err: 'Щось пішло не так. Спробуйте ще раз або напишіть на order@dronepartshub.eu.', note: 'Не вводьте тут персональні дані. Чат відповідає автоматично (AI) на основі каталогу.', contact: 'Контактна форма', stock: 'в наявності', nostock: 'під замовлення', btn: 'Пошук запчастин з AI' },
    en: { title: 'Find a part', hello: 'Hi! Tell me the drone model (T25P, T50, T100) and the part name or part number, e.g. "pump T50" or "YC.JG.ZS001730".', ph: 'Model, name or part number…', send: 'Send', add: 'Add to cart', open: 'Details', err: 'Something went wrong. Try again or email order@dronepartshub.eu.', note: 'Do not enter personal data here. The chat answers automatically (AI) based on the catalogue.', contact: 'Contact form', stock: 'in stock', nostock: 'on order', btn: 'Find parts with AI' }
  };
  var T = function () { return TX[L()] || TX.en; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function utm() { try { var u = new URLSearchParams(location.search), o = JSON.parse(localStorage.getItem('dph_utm') || '{}'); ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (u.get(k)) o[k] = u.get(k); }); localStorage.setItem('dph_utm', JSON.stringify(o)); return o; } catch (e) { return {}; } }
  utm();

  // ── Wysyłka formularza → /api/lead → Bitrix24 ──────────────────────────
  function send(kind, data) {
    var body = Object.assign({ kind: kind, page: location.pathname, lang: L() }, utm(), data || {});
    return fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok; }); })
      .catch(function () { return false; });
  }

  // ── Czat AI ─────────────────────────────────────────────────────────────
  var hist = [], ctxModel = null, box, list, input, busy = false;
  function css() {
    var s = document.createElement('style');
    s.textContent = '#dphChatBtn{position:fixed;right:20px;bottom:20px;z-index:9000;display:flex;align-items:center;gap:8px;padding:14px 18px;border:0;border-radius:999px;background:var(--color-accent,#c8a032);color:#111;font:700 15px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.4)}' +
      '#dphChat{position:fixed;right:20px;bottom:84px;z-index:9001;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));display:none;flex-direction:column;background:#0b0b0b;color:#eee;border:1px solid var(--color-accent,#c8a032);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);font:14px/1.45 system-ui,sans-serif;overflow:hidden}' +
      '#dphChat.open{display:flex}#dphChat header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #222;font-weight:700;color:var(--color-accent,#c8a032)}' +
      '#dphChat header button{background:none;border:0;color:#aaa;font-size:22px;cursor:pointer}#dphList{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}' +
      '.dph-m{max-width:88%;padding:9px 12px;border-radius:12px;white-space:pre-wrap}.dph-u{align-self:flex-end;background:#2a2a2a}.dph-a{align-self:flex-start;background:#161616;border:1px solid #262626}' +
      '.dph-p{display:flex;gap:10px;align-items:center;background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:8px}.dph-p img{width:48px;height:48px;object-fit:contain;background:#fff;border-radius:6px;flex:none}' +
      '.dph-p b{display:block;font-size:13px;color:#fff}.dph-p small{color:#999;display:block}.dph-p .dph-pr{color:var(--color-accent,#c8a032);font-weight:700}.dph-p .dph-act{display:flex;gap:6px;margin-top:4px}' +
      '.dph-p .dph-act a,.dph-p .dph-act button{font:600 12px system-ui,sans-serif;padding:4px 8px;border-radius:6px;border:1px solid #444;background:#1e1e1e;color:#eee;cursor:pointer;text-decoration:none}' +
      '#dphChat form{display:flex;gap:6px;padding:10px;border-top:1px solid #222}#dphChat input{flex:1;min-width:0;padding:10px;border-radius:8px;border:1px solid #333;background:#151515;color:#fff;font-size:16px}' +
      '#dphChat form button{padding:0 14px;border:0;border-radius:8px;background:var(--color-accent,#c8a032);color:#111;font-weight:700;cursor:pointer}#dphChat .dph-note{padding:0 12px 8px;color:#777;font-size:11px}' +
      '@media(max-width:480px){#dphChatBtn span{display:none}}';
    document.head.appendChild(s);
  }
  function add(cls, html) { var d = document.createElement('div'); d.className = 'dph-m ' + cls; d.innerHTML = html; list.appendChild(d); list.scrollTop = list.scrollHeight; return d; }
  function price(usd) { try { return typeof getPrimaryPrice === 'function' ? getPrimaryPrice(usd) : '$' + usd.toFixed(2); } catch (e) { return '$' + usd; } }
  function card(p) {
    var t = T();
    var d = document.createElement('div'); d.className = 'dph-p';
    d.innerHTML = (p.zdjecie_url ? '<img loading="lazy" alt="" src="' + esc(p.zdjecie_url) + '">' : '') +
      '<div style="min-width:0"><b>' + esc(p.nazwa) + '</b><small>' + esc(p.model) + ' · ' + esc(p.numer_katalogowy) + '</small>' +
      '<small><span class="dph-pr">' + esc(price(p.cena_usd)) + '</span> · ' + (p.stan_magazynowy > 0 ? t.stock : t.nostock) + '</small>' +
      '<div class="dph-act"><button type="button">' + t.add + '</button><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + t.open + '</a></div></div>';
    d.querySelector('button').onclick = function () {
      try {
        var st = S(); if (st && st.parts && !st.parts.some(function (x) { return x.id == p.id; })) st.parts.push({ id: p.id, model: p.model, nazwa_pl: p.nazwa_pl, nazwa_en: p.nazwa_en, nazwa_ua: p.nazwa_ua, numer_katalogowy: p.numer_katalogowy, cena_usd: p.cena_usd, zdjecie_url: p.zdjecie_url });
        addToCart(p.id);
      } catch (e) { location.href = 'product.html?id=' + encodeURIComponent(p.id); }
    };
    list.appendChild(d);
  }
  function ask(q) {
    if (busy || !q) return; busy = true;
    add('dph-u', esc(q));
    var wait = add('dph-a', '…');
    fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: q, lang: L(), history: hist, model: ctxModel }) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        wait.innerHTML = esc(j.reply);
        (j.parts || []).forEach(card);
        list.scrollTop = list.scrollHeight;
        if (j.model) ctxModel = j.model;
        hist.push({ role: 'user', content: q }, { role: 'assistant', content: j.reply });
        hist = hist.slice(-6);
      })
      .catch(function () { wait.innerHTML = esc(T().err) + ' <a href="contact.html" style="color:inherit">' + esc(T().contact) + '</a>'; })
      .then(function () { busy = false; });
  }
  function build() {
    ['liveChat', 'chatPopup'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    css();
    var t = T();
    var b = document.createElement('button'); b.id = 'dphChatBtn'; b.type = 'button'; b.innerHTML = '🔍 <span>' + esc(t.btn) + '</span>'; b.setAttribute('aria-label', t.btn);
    box = document.createElement('div'); box.id = 'dphChat'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', t.title);
    box.innerHTML = '<header><span>🔍 ' + esc(t.title) + '</span><button type="button" aria-label="×">×</button></header><div id="dphList"></div><div class="dph-note">' + esc(t.note) + '</div><form><input name="q" autocomplete="off" maxlength="500" placeholder="' + esc(t.ph) + '"><button>' + esc(t.send) + '</button></form>';
    document.body.appendChild(b); document.body.appendChild(box);
    list = box.querySelector('#dphList'); input = box.querySelector('input');
    add('dph-a', esc(t.hello));
    b.onclick = function () { DPH.openChat(); };
    box.querySelector('header button').onclick = function () { box.classList.remove('open'); };
    box.querySelector('form').onsubmit = function (e) { e.preventDefault(); var q = input.value.trim(); input.value = ''; ask(q); };
  }
  function relabel() {
    var t = T();
    box.querySelector('header span').textContent = '🔍 ' + t.title;
    box.querySelector('.dph-note').textContent = t.note;
    input.placeholder = t.ph; box.querySelector('form button').textContent = t.send;
    var first = list.querySelector('.dph-m'); if (first && list.children.length === 1) first.textContent = t.hello;
  }
  window.DPH = {
    send: send,
    openChat: function (q) { if (!box) build(); relabel(); box.classList.add('open'); setTimeout(function () { input.focus(); }, 50); if (q) ask(q); return false; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
