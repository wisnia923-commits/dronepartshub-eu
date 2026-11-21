/* ═══════════════════════════════════════════════════════════════════════
 *  KIT-PHOTOS.js — zdjęcia zbiorcze zestawów DJI + zaznaczanie części
 *  ─────────────────────────────────────────────────────────────────────
 *  - Zdjęcie jest "zbiorcze", jeśli ten sam plik ma kilka różnych części
 *    (różne numery DJI bez końcówki -2/-3). Liczone w przeglądarce, więc
 *    cotygodniowa aktualizacja parts.json z bota tego nie psuje.
 *  - Część bez zdjęcia dostaje zdjęcie od swojego odpowiednika (-2, -3)
 *    albo zdjęcie zestawu przypisane w markers.json (pole img).
 *  - Znaczniki (kółko na zdjęciu) są w osobnym pliku markers.json:
 *      { "YC.JG.QX002312": { "img": "/images/parts/m02-09-image9.webp",
 *                            "x": 41.2, "y": 63.5, "r": 6 } }
 *    x, y, r — w procentach szerokości/wysokości zdjęcia.
 *    Plik robi się narzędziem znacznik.html.
 * ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const baseNo = n => String(n || '').replace(/-\d+$/, '');
  let markers = {}, extra = {};
  const getJSON = u => fetch(u, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  // zdjecia-czesci.json: { "KOD": { "url": "...", "typ": "czesc" | "modul" } } — zdjęcia z SharePoint
  const markersReady = Promise.all([getJSON('/markers.json'), getJSON('/zdjecia-czesci.json')])
    .then(([m, e]) => { markers = m || {}; extra = e || {}; });

  let cacheFor = null, kitImgs = null, siblingImg = null;
  function index(all) {
    if (cacheFor === all) return;
    cacheFor = all;
    const byImg = {};
    siblingImg = {};
    (all || []).forEach(p => {
      if (!p.zdjecie_url) return;
      (byImg[p.zdjecie_url] = byImg[p.zdjecie_url] || new Set()).add(baseNo(p.numer_katalogowy));
      siblingImg[baseNo(p.numer_katalogowy)] = siblingImg[baseNo(p.numer_katalogowy)] || p.zdjecie_url;
    });
    kitImgs = new Set(Object.keys(byImg).filter(u => byImg[u].size > 1));
  }

  const T = {
    pl: { badge: 'Zdjęcie zbiorcze zestawu', find: 'Szukana część na zdjęciu', no: 'nr DJI', mark: 'zaznaczona czerwonym kółkiem', nomark: 'sprawdź numer części przy zamówieniu' },
    en: { badge: 'Kit overview photo', find: 'Part shown in this photo', no: 'DJI part no.', mark: 'marked with a red circle', nomark: 'check the part number when ordering' },
    ua: { badge: 'Загальне фото комплекту', find: 'Шукана деталь на фото', no: 'номер DJI', mark: 'позначена червоним колом', nomark: 'перевірте номер деталі під час замовлення' },
    cn: { badge: '套件总图', find: '图中所需零件', no: 'DJI 物料号', mark: '已用红圈标出', nomark: '订购时请核对物料号' },
  };
  const t = lang => T[lang] || T.en;

  window.DPH_KIT = {
    ready: markersReady,
    /** URL zdjęcia dla części (własne albo od odpowiednika -2/-3) */
    imageFor(p, all) {
      index(all);
      const m = markers[p.numer_katalogowy] || markers[baseNo(p.numer_katalogowy)];
      const e = extra[p.numer_katalogowy] || extra[baseNo(p.numer_katalogowy)];
      return p.zdjecie_url || siblingImg[baseNo(p.numer_katalogowy)] || (e && e.url) || (m && m.img) || '';
    },
    /** Czy zdjęcie części jest zbiorcze */
    isKit(p, all) {
      index(all); const u = this.imageFor(p, all);
      const e = extra[p.numer_katalogowy] || extra[baseNo(p.numer_katalogowy)];
      return !!u && (kitImgs.has(u) || (e && e.url === u && e.typ === 'modul') || (!p.zdjecie_url && !!this.marker(p, all)));
    },
    /** Znacznik dla części, tylko jeśli dotyczy tego samego zdjęcia */
    marker(p, all) {
      const m = markers[p.numer_katalogowy] || markers[baseNo(p.numer_katalogowy)];
      return m && (!m.img || m.img === this.imageFor(p, all)) ? m : null;
    },
    badgeHTML(lang) { return `<span class="kit-badge">📷 ${t(lang).badge}</span>`; },
    /** Zdjęcie z ewentualnym kółkiem; używane na stronie produktu */
    figureHTML(p, all, name, lang) {
      const url = this.imageFor(p, all);
      if (!url) return '';
      const kit = this.isKit(p, all), m = kit ? this.marker(p, all) : null;
      const R = m ? (m.r || 6) : 0;
      const ring = m ? `<span class="kit-marker" style="left:${m.x}%;top:${m.y}%;width:${R * 2}%;margin-left:-${R}%;margin-top:-${R}%;"></span>` : '';
      return `<figure class="kit-figure"><span class="kit-wrap">
          <img src="${url}" alt="${name}" onload="DPH_KIT.fit(this)" onerror="this.closest('.kit-figure').outerHTML='<div class=&quot;product-image-placeholder&quot;>🔧</div>'">
          ${ring}${kit ? this.badgeHTML(lang) : ''}</span>
        </figure>`;
    },
    /** Dopasuj zdjęcie w całości do ramki (kółko liczone względem zdjęcia) */
    fit(img) {
      const fig = img.closest('.kit-figure'); if (!fig || !img.naturalWidth) return;
      const cs = getComputedStyle(fig);
      const cw = fig.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ch = fig.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (cw <= 0 || ch <= 0) return;
      const k = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      img.style.setProperty('width', Math.floor(img.naturalWidth * k) + 'px', 'important');
      img.style.setProperty('height', Math.floor(img.naturalHeight * k) + 'px', 'important');
    },
    /** Ramka pod zdjęciem: nazwa + numer DJI */
    noteHTML(p, all, name, lang) {
      if (!this.isKit(p, all)) return '';
      const L = t(lang), m = this.marker(p, all);
      return `<div class="kit-note"><strong>${L.find}:</strong> ${name}<br>
          <span class="kit-note__no">${L.no}: ${baseNo(p.numer_katalogowy)}</span>
          <span class="kit-note__hint">— ${m ? L.mark : L.nomark}</span></div>`;
    },
  };

  const css = `
  .kit-figure{position:relative;margin:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .kit-figure{box-sizing:border-box}
  .kit-wrap{position:relative;display:inline-block;line-height:0}
  .kit-wrap img{display:block;max-width:none;max-height:none}
  .product-image-main .kit-figure{padding:12px}
  .product-image-main .kit-figure img{padding:0!important;object-fit:fill!important}
  .kit-marker{position:absolute;aspect-ratio:1;box-sizing:border-box;border:3px solid #e1251b;border-radius:50%;
    box-shadow:0 0 0 3px rgba(255,255,255,.8),0 0 14px rgba(225,37,27,.7);animation:kitPulse 1.6s ease-in-out infinite;pointer-events:none}
  @keyframes kitPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
  .kit-badge{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.75);color:#fff;font-size:10px;font-weight:700;
    letter-spacing:.06em;text-transform:uppercase;padding:3px 7px;border-radius:4px;pointer-events:none;line-height:1.4;white-space:nowrap}
  .kit-note{margin-top:12px;padding:12px 14px;border-left:3px solid #e1251b;background:rgba(255,255,255,.05);font-size:14px;line-height:1.5}
  .kit-note__no{font-family:var(--font-mono,monospace)}
  .kit-note__hint{color:var(--color-text-muted,#999);font-size:12px}
  .product-card__img{position:relative}`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => document.querySelectorAll('.kit-figure img').forEach(i => window.DPH_KIT.fit(i)), 150); });
})();
