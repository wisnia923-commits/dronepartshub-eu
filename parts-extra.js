/* ═══════════════════════════════════════════════════════════════════════
 *  PARTS-EXTRA.js — części DJI spoza bota (z plików DJI / katalogu Bitrix)
 *  ─────────────────────────────────────────────────────────────────────
 *  - Każde pobranie parts.json (app.js, product.html, fix-parts.js) dostaje
 *    dodatkowo pozycje z parts-extra.json. Bot nadpisuje tylko parts.json,
 *    więc te części nie znikają po jego cotygodniowej aktualizacji.
 *  - Część z cena_usd = null: „Cena na zapytanie” i przycisk „Zapytaj o cenę”
 *    (formularz kontaktowy z numerem części) zamiast koszyka.
 *  - Radary, LiDAR i czujniki wizyjne trafiają do kategorii „Radary i czujniki”.
 *  Ładować PRZED app.js.
 * ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const RAD = { pl: 'Radary i czujniki', en: 'Radars & Sensors', ua: 'Радари і датчики', cn: '雷达和传感器' };
  const RAD_RX = /radar|lidar|fisheye|binocular|vision sensor|radaru|lidaru|czujnik wizyjn|czujników wizyjn|czujnik stereo/i;
  const ST = () => (typeof STATE !== 'undefined' ? STATE : null);
  const L = () => (ST() && ST().lang) || 'pl';
  const TXT = {
    pl: { ask: 'Cena na zapytanie', btn: 'Zapytaj o cenę' },
    en: { ask: 'Price on request', btn: 'Ask for price' },
    ua: { ask: 'Ціна за запитом', btn: 'Запитати ціну' },
    cn: { ask: '价格面议', btn: '询价' },
  };
  const tx = () => TXT[L()] || TXT.en;

  function fixCategory(p) {
    if (RAD_RX.test((p.nazwa_en || '') + ' ' + (p.nazwa_pl || ''))) {
      p.kategoria_pl = RAD.pl; p.kategoria_en = RAD.en; p.kategoria_ua = RAD.ua; p.kategoria_cn = RAD.cn;
    }
    return p;
  }

  // 1) fetch('parts.json') → parts.json + parts-extra.json
  const origFetch = window.fetch.bind(window);
  let extraP = null;
  const getExtra = () => (extraP = extraP || origFetch('/parts-extra.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : [])).catch(() => []));
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    let path = '';
    try { path = new URL(url, location.href).pathname; } catch (e) {}
    if (path !== '/parts.json') return origFetch(input, init);
    const [res, extra] = await Promise.all([origFetch(input, init), getExtra()]);
    if (!res.ok) return res;
    let base = await res.json();
    const arr = Array.isArray(base) ? base : (base.parts || []);
    const have = new Set(arr.map(p => String(p.numer_katalogowy)));
    const merged = arr.concat(extra.filter(p => !have.has(String(p.numer_katalogowy)))).map(fixCategory);
    return new Response(JSON.stringify(merged), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const isAsk = p => p && (p.cena_usd === null || p.cena_usd === undefined || p.na_zapytanie);
  const findPart = id => ((ST() && ST().parts && ST().parts.length ? ST().parts : null) || window.EMBEDDED_PARTS || []).find(p => p.id == id);

  window.DPH_ASK = function (id) {
    const p = findPart(id);
    const code = p ? String(p.numer_katalogowy).replace(/-\d+$/, '') : '';
    const name = p ? (p['nazwa_' + L()] || p.nazwa_en || p.nazwa_pl) : '';
    location.href = 'contact.html?czesc=' + encodeURIComponent(code) + '&nazwa=' + encodeURIComponent(name) + '&model=' + encodeURIComponent(p ? p.model : '');
  };

  // 2) Po załadowaniu app.js: ceny null i koszyk
  document.addEventListener('DOMContentLoaded', function () {
    ['priceUSD', 'pricePLN', 'priceEUR', 'getPrimaryPrice'].forEach(fn => {
      const orig = window[fn];
      if (typeof orig !== 'function') return;
      window[fn] = function (amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return fn === 'getPrimaryPrice' || fn === 'pricePLN' ? tx().ask : '—';
        return orig.apply(this, arguments);
      };
    });
    if (typeof window.addToCart === 'function') {
      const origAdd = window.addToCart;
      window.addToCart = function (id) {
        if (isAsk(findPart(id))) return window.DPH_ASK(id);
        return origAdd.apply(this, arguments);
      };
    }
    // sortowanie po cenie: części „na zapytanie” na końcu
    if (typeof window.applyFilters === 'function') {
      const origAF = window.applyFilters;
      window.applyFilters = function () {
        origAF.apply(this, arguments);
        const S = ST(); const s = S && S.filters && S.filters.sort;
        if (s === 'price_asc' || s === 'price_desc') {
          const arr = S.filteredParts || [];
          const priced = arr.filter(p => !isAsk(p)), ask = arr.filter(isAsk);
          S.filteredParts = priced.concat(ask);
          if (typeof renderCatalog === 'function') renderCatalog();
        }
      };
    }
    // etykiety przycisków przy częściach „na zapytanie”
    const relabel = () => {
      document.querySelectorAll('[onclick*="addToCart("],[onclick*="addProductToCart("]').forEach(b => {
        const m = String(b.getAttribute('onclick')).match(/addTo(?:Product)?Cart\((?:')?(\w+)/) || String(b.getAttribute('onclick')).match(/addProductToCart\((?:')?(\w+)/);
        if (!m) return;
        const p = findPart(m[1]);
        if (isAsk(p) && !b.dataset.ask) {
          b.dataset.ask = '1'; b.textContent = '💬 ' + tx().btn;
          const card = b.closest('.product-card');
          if (card) {
            card.querySelectorAll('.product-card__price-row:not(.primary)').forEach(r => r.style.display = 'none');
            const pr = card.querySelector('.product-card__price-row.primary');
            if (pr) pr.innerHTML = '<span>' + tx().ask + '</span>';
          }
        }
      });
      const q = document.getElementById('qtyInput');
      const big = document.querySelector('.add-to-cart-large[data-ask]');
      if (q && big) q.closest('.qty-selector') && (q.closest('.qty-selector').style.display = 'none');
    };
    new MutationObserver(() => relabel()).observe(document.body, { childList: true, subtree: true });
  });
})();
