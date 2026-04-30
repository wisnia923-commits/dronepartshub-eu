/* ========================================
   DRONE PARTS HUB - App Logic
   Koszyk, filtry, multi-lang, multi-currency
   ======================================== */

const CONFIG = {
  TELEGRAM_BOT: 'https://t.me/dji_agras_parts_bot',
  EMAIL: 'contact@dronepartshub.eu',
  CURRENCY_RATE_USD_PLN: 4.05,
  CURRENCY_RATE_USD_EUR: 0.92,
  MARGIN_BUFFER: 1.05,
  PER_PAGE: 24
};

const STATE = {
  parts: [],
  filtered: [],
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  lang: localStorage.getItem('lang') || 'pl',
  currency: localStorage.getItem('currency') || 'PLN',
  filters: {
    model: 'all',
    category: 'all',
    search: '',
    sort: 'name'
  },
  page: 1
};

const ICONS_BY_CATEGORY = {
  'Silnik/ESC': '⚙️',
  'Akumulator': '🔋',
  'Kabel': '🔌',
  'Pompa': '💧',
  'Śmigło': '🛩️',
  'Mocowanie': '🔩',
  'Śruba': '🔩',
  'Generator': '⚡',
  'Łączność': '📡',
  'Naklejka/Etykieta': '🏷️',
  'Pianka/Wypełnienie': '🧽',
  'Inne': '🔧'
};

const TRANSLATIONS = {
  pl: {
    nav_home: 'Start', nav_parts: 'Części', nav_rental: 'Wynajem',
    nav_drones: 'Drony', nav_about: 'O nas', nav_contact: 'Kontakt',
    nav_blog: 'Blog', nav_hurt: 'Hurt',
    cart: 'Koszyk', search: 'Szukaj części lub SKU...',
    catalog_title: 'Katalog części',
    catalog_sub: '2168 części pasujących do T25, T10, T70P, D6000I',
    sort_name: 'Po nazwie', sort_price_asc: 'Cena rosnąco', sort_price_desc: 'Cena malejąco',
    available: 'Dostępne', on_order: 'Na zamówienie', ask_price: 'Zapytaj o cenę',
    add_to_cart: 'Do koszyka', view_details: 'Szczegóły',
    order_form_title: 'Złóż zamówienie',
    name: 'Imię i nazwisko', phone: 'Telefon', email: 'Email',
    address: 'Adres dostawy', notes: 'Uwagi',
    cancel: 'Anuluj', order_via_telegram: 'Wyślij przez Telegram',
    cart_empty: 'Twój koszyk jest pusty',
    total: 'Razem',
    filter_model: 'Model', filter_category: 'Kategoria', filter_search: 'Wyszukiwanie',
    all: 'Wszystkie',
    showing: 'Pokazuję', of: 'z', parts: 'części'
  },
  en: {
    nav_home: 'Home', nav_parts: 'Parts', nav_rental: 'Rental',
    nav_drones: 'Drones', nav_about: 'About', nav_contact: 'Contact',
    nav_blog: 'Blog', nav_hurt: 'Wholesale',
    cart: 'Cart', search: 'Search parts or SKU...',
    catalog_title: 'Parts Catalog',
    catalog_sub: '2168 parts for T25, T10, T70P, D6000I',
    sort_name: 'By name', sort_price_asc: 'Price asc', sort_price_desc: 'Price desc',
    available: 'In stock', on_order: 'On order', ask_price: 'Ask for price',
    add_to_cart: 'Add to cart', view_details: 'Details',
    order_form_title: 'Place order',
    name: 'Full name', phone: 'Phone', email: 'Email',
    address: 'Delivery address', notes: 'Notes',
    cancel: 'Cancel', order_via_telegram: 'Send via Telegram',
    cart_empty: 'Your cart is empty',
    total: 'Total',
    filter_model: 'Model', filter_category: 'Category', filter_search: 'Search',
    all: 'All',
    showing: 'Showing', of: 'of', parts: 'parts'
  }
};

/* ========== INIT ========== */
async function init() {
  try {
    const response = await fetch('parts.json');
    STATE.parts = await response.json();
    STATE.filtered = [...STATE.parts];
    
    applyTranslations();
    updateCartCount();
    
    if (document.querySelector('.products-grid')) {
      renderFilters();
      applyFilters();
    }
    
    if (document.querySelector('.featured-products')) {
      renderFeatured();
    }
    
    if (document.querySelector('.models-counter')) {
      updateModelsCounter();
    }
  } catch (e) {
    console.error('Failed to load parts.json:', e);
  }
}

/* ========== TRANSLATIONS ========== */
function applyTranslations() {
  const t = TRANSLATIONS[STATE.lang] || TRANSLATIONS.pl;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  const langBtn = document.querySelector('.nav__lang');
  if (langBtn) langBtn.textContent = STATE.lang.toUpperCase();
}

function toggleLang() {
  STATE.lang = STATE.lang === 'pl' ? 'en' : 'pl';
  localStorage.setItem('lang', STATE.lang);
  applyTranslations();
  if (STATE.filtered.length) renderProducts();
}

/* ========== CURRENCY ========== */
function formatPrice(usd) {
  if (!usd || usd === 0) return TRANSLATIONS[STATE.lang].ask_price;
  const adjusted = usd * CONFIG.MARGIN_BUFFER;
  if (STATE.currency === 'PLN') return (adjusted * CONFIG.CURRENCY_RATE_USD_PLN).toFixed(2) + ' zł';
  if (STATE.currency === 'EUR') return (adjusted * CONFIG.CURRENCY_RATE_USD_EUR).toFixed(2) + ' €';
  return '$' + adjusted.toFixed(2);
}

/* ========== PART STATUS ========== */
function getPartStatus(part) {
  const price = part.cena_sprzedazy_usd || 0;
  const stock = part.stan_magazynowy || 0;
  if (price > 0 && stock > 0) return 'available';
  if (price > 0 && stock === 0) return 'on_order';
  return 'ask_price';
}

function getPartName(part) {
  const lang = STATE.lang;
  if (lang === 'pl' && part.nazwa_pl) return part.nazwa_pl;
  if (lang === 'en' && part.nazwa_en) return part.nazwa_en;
  if (lang === 'ua' && part.nazwa_ua) return part.nazwa_ua;
  return part.nazwa_en || part.nazwa_pl || part.sku || 'Brak nazwy';
}

function getPartIcon(part) {
  return part.icon || ICONS_BY_CATEGORY[part.kategoria_pl] || ICONS_BY_CATEGORY['Inne'];
}

/* ========== FILTERS ========== */
function renderFilters() {
  const filtersEl = document.querySelector('.filters');
  if (!filtersEl) return;
  
  const t = TRANSLATIONS[STATE.lang];
  const models = [...new Set(STATE.parts.map(p => p.model_glowny || p.model).filter(Boolean))].sort();
  const categories = [...new Set(STATE.parts.map(p => p.kategoria_pl).filter(Boolean))].sort();
  
  filtersEl.innerHTML = `
    <div class="filter-group">
      <div class="filter-group__title">${t.filter_search}</div>
      <input type="text" placeholder="${t.search}" oninput="STATE.filters.search=this.value;applyFilters();">
    </div>
    
    <div class="filter-group">
      <div class="filter-group__title">${t.filter_model}</div>
      <label><input type="radio" name="model" value="all" ${STATE.filters.model==='all'?'checked':''} onchange="STATE.filters.model=this.value;applyFilters();"> ${t.all}</label>
      ${models.map(m => {
        const count = STATE.parts.filter(p => (p.model_glowny || p.model) === m).length;
        return `<label><input type="radio" name="model" value="${m}" onchange="STATE.filters.model=this.value;applyFilters();"> ${m} (${count})</label>`;
      }).join('')}
    </div>
    
    <div class="filter-group">
      <div class="filter-group__title">${t.filter_category}</div>
      <label><input type="radio" name="category" value="all" checked onchange="STATE.filters.category=this.value;applyFilters();"> ${t.all}</label>
      ${categories.slice(0, 10).map(c => {
        const count = STATE.parts.filter(p => p.kategoria_pl === c).length;
        return `<label><input type="radio" name="category" value="${c}" onchange="STATE.filters.category=this.value;applyFilters();"> ${c} (${count})</label>`;
      }).join('')}
    </div>
  `;
}

function applyFilters() {
  let result = [...STATE.parts];
  
  if (STATE.filters.model !== 'all') {
    result = result.filter(p => (p.model_glowny || p.model) === STATE.filters.model);
  }
  if (STATE.filters.category !== 'all') {
    result = result.filter(p => p.kategoria_pl === STATE.filters.category);
  }
  if (STATE.filters.search) {
    const q = STATE.filters.search.toLowerCase();
    result = result.filter(p =>
      (p.sku || '').toLowerCase().includes(q) ||
      (p.nazwa_pl || '').toLowerCase().includes(q) ||
      (p.nazwa_en || '').toLowerCase().includes(q) ||
      (p.numer_katalogowy || '').toLowerCase().includes(q)
    );
  }
  
  if (STATE.filters.sort === 'price_asc') result.sort((a,b) => (a.cena_sprzedazy_usd||0) - (b.cena_sprzedazy_usd||0));
  if (STATE.filters.sort === 'price_desc') result.sort((a,b) => (b.cena_sprzedazy_usd||0) - (a.cena_sprzedazy_usd||0));
  if (STATE.filters.sort === 'name') result.sort((a,b) => getPartName(a).localeCompare(getPartName(b)));
  
  STATE.filtered = result;
  STATE.page = 1;
  renderProducts();
}

/* ========== RENDER PRODUCTS ========== */
function renderProducts() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;
  
  const t = TRANSLATIONS[STATE.lang];
  const start = (STATE.page - 1) * CONFIG.PER_PAGE;
  const items = STATE.filtered.slice(start, start + CONFIG.PER_PAGE);
  
  const countEl = document.querySelector('.results-count');
  if (countEl) countEl.textContent = `${t.showing} ${items.length} ${t.of} ${STATE.filtered.length} ${t.parts}`;
  
  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-muted);">
      Nie znaleziono części pasujących do filtrów.
    </div>`;
    document.querySelector('.pagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = items.map(part => {
    const status = getPartStatus(part);
    const badgeClass = `product-card__badge--${status}`;
    const badgeText = t[status === 'available' ? 'available' : status === 'on_order' ? 'on_order' : 'ask_price'];
    
    return `
      <div class="product-card" onclick="openProduct('${part.sku}')">
        <div class="product-card__img">${getPartIcon(part)}</div>
        <div class="product-card__body">
          <span class="product-card__badge ${badgeClass}">${badgeText}</span>
          <div class="product-card__title">${getPartName(part)}</div>
          <div class="product-card__sku">${part.sku || part.numer_katalogowy}</div>
          <div class="product-card__price ${status==='ask_price'?'product-card__price--quote':''}">${formatPrice(part.cena_sprzedazy_usd)}</div>
          <button class="product-card__btn" onclick="event.stopPropagation();addToCart('${part.sku}')">${t.add_to_cart}</button>
        </div>
      </div>
    `;
  }).join('');
  
  renderPagination();
}

function renderPagination() {
  const pagEl = document.querySelector('.pagination');
  if (!pagEl) return;
  
  const totalPages = Math.ceil(STATE.filtered.length / CONFIG.PER_PAGE);
  if (totalPages <= 1) { pagEl.innerHTML = ''; return; }
  
  let html = '';
  if (STATE.page > 1) html += `<button onclick="STATE.page--;renderProducts();">←</button>`;
  
  const showPages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - STATE.page) <= 2) showPages.push(i);
    else if (showPages[showPages.length-1] !== '...') showPages.push('...');
  }
  
  showPages.forEach(p => {
    if (p === '...') html += `<button disabled>...</button>`;
    else html += `<button class="${p===STATE.page?'active':''}" onclick="STATE.page=${p};renderProducts();window.scrollTo(0,0);">${p}</button>`;
  });
  
  if (STATE.page < totalPages) html += `<button onclick="STATE.page++;renderProducts();window.scrollTo(0,0);">→</button>`;
  pagEl.innerHTML = html;
}

function renderFeatured() {
  const grid = document.querySelector('.featured-products');
  if (!grid) return;
  const featured = STATE.parts.slice(0, 8);
  const t = TRANSLATIONS[STATE.lang];
  
  grid.innerHTML = featured.map(part => {
    const status = getPartStatus(part);
    return `
      <div class="product-card" onclick="window.location.href='catalog.html'">
        <div class="product-card__img">${getPartIcon(part)}</div>
        <div class="product-card__body">
          <span class="product-card__badge product-card__badge--${status}">${t[status]}</span>
          <div class="product-card__title">${getPartName(part)}</div>
          <div class="product-card__sku">${part.sku}</div>
          <div class="product-card__price">${formatPrice(part.cena_sprzedazy_usd)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function updateModelsCounter() {
  const counter = document.querySelector('.models-counter');
  if (!counter) return;
  
  const models = {};
  STATE.parts.forEach(p => {
    const m = p.model_glowny || p.model;
    if (m) models[m] = (models[m] || 0) + 1;
  });
  
  const sorted = Object.entries(models).sort((a,b) => b[1] - a[1]);
  
  counter.innerHTML = sorted.map(([model, count]) => `
    <a href="catalog.html?model=${model}" class="model-card">
      <span class="model-card__icon">🚁</span>
      <div class="model-card__name">${model}</div>
      <div class="model-card__count">${count} części</div>
    </a>
  `).join('');
}

/* ========== CART ========== */
function addToCart(sku) {
  const part = STATE.parts.find(p => p.sku === sku);
  if (!part) return;
  
  const existing = STATE.cart.find(item => item.sku === sku);
  if (existing) existing.qty++;
  else STATE.cart.push({ sku, qty: 1, name: getPartName(part), price: part.cena_sprzedazy_usd, icon: getPartIcon(part) });
  
  saveCart();
  showCartFeedback();
}

function removeFromCart(sku) {
  STATE.cart = STATE.cart.filter(i => i.sku !== sku);
  saveCart();
  renderCart();
}

function changeQty(sku, delta) {
  const item = STATE.cart.find(i => i.sku === sku);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) STATE.cart = STATE.cart.filter(i => i.sku !== sku);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(STATE.cart));
  updateCartCount();
}

function updateCartCount() {
  const total = STATE.cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.nav__cart-count').forEach(el => el.textContent = total);
}

function showCartFeedback() {
  const btn = event?.target;
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✓ Dodano';
    btn.style.background = '#10b981';
    setTimeout(() => { btn.textContent = original; btn.style.background = ''; }, 1500);
  }
}

function openCart() {
  document.querySelector('.cart-drawer').classList.add('show');
  document.querySelector('.cart-drawer__overlay').classList.add('show');
  renderCart();
}

function closeCart() {
  document.querySelector('.cart-drawer').classList.remove('show');
  document.querySelector('.cart-drawer__overlay').classList.remove('show');
}

function renderCart() {
  const body = document.querySelector('.cart-drawer__body');
  const footer = document.querySelector('.cart-drawer__footer');
  if (!body) return;
  
  const t = TRANSLATIONS[STATE.lang];
  
  if (STATE.cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><div style="font-size:60px;margin-bottom:16px;">🛒</div>${t.cart_empty}</div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  
  body.innerHTML = STATE.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__icon">${item.icon}</div>
      <div>
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__sku">${item.sku}</div>
        <div class="cart-item__price">${formatPrice(item.price)}</div>
        <div class="cart-item__qty">
          <button onclick="changeQty('${item.sku}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.sku}', 1)">+</button>
          <button class="cart-item__remove" onclick="removeFromCart('${item.sku}')">Usuń</button>
        </div>
      </div>
    </div>
  `).join('');
  
  const total = STATE.cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  document.querySelector('.cart-totals').innerHTML = `
    <span>${t.total}:</span>
    <strong>${total > 0 ? formatPrice(total) : t.ask_price}</strong>
  `;
  if (footer) footer.style.display = 'block';
}

/* ========== ORDER ========== */
function openOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.add('show');
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.remove('show');
}

function submitOrder(form) {
  if (STATE.cart.length === 0) {
    alert('Twój koszyk jest pusty!');
    return;
  }
  
  const data = new FormData(form);
  let message = `🛒 NOWE ZAMÓWIENIE\n\n`;
  message += `👤 ${data.get('name')}\n`;
  message += `📞 ${data.get('phone')}\n`;
  message += `📧 ${data.get('email')}\n`;
  message += `📦 ${data.get('address')}\n\n`;
  message += `🛍️ ZAMÓWIENIE:\n`;
  
  STATE.cart.forEach(item => {
    message += `• ${item.name} (${item.sku}) x${item.qty}\n`;
  });
  
  if (data.get('notes')) message += `\n📝 Uwagi: ${data.get('notes')}\n`;
  
  // Skopiuj do schowka
  navigator.clipboard.writeText(message).then(() => {
    alert('✅ Zamówienie skopiowane do schowka!\n\nOtwiera się bot Telegram - wklej tam zamówienie (Ctrl+V).');
    window.open(CONFIG.TELEGRAM_BOT, '_blank');
    closeOrderModal();
    closeCart();
  }).catch(() => {
    // Fallback: encode in URL
    window.open(`${CONFIG.TELEGRAM_BOT}?start=order`, '_blank');
    alert('Skopiuj poniższe zamówienie i wklej w Telegramie:\n\n' + message);
  });
}

function openProduct(sku) {
  window.location.href = `product.html?sku=${sku}`;
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', init);
