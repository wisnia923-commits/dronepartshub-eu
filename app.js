
// Katalog części ładowany z parts.json (1537 pozycji)
window._origFetchRates = window.fetch.bind(window);
/* ==========================================================================
   DJI Agras Parts - Logika sklepu
   - Koszyk w localStorage
   - Tłumaczenia 4 języków
   - Konwersja walut (USD/PLN/EUR z buforem +5%)
   - Filtry, wyszukiwanie, paginacja
   - Wysyłka zamówienia do Bitrix24 (/api/lead, dph.js)
   ========================================================================== */

const APP = {
  ITEMS_PER_PAGE: 24,

  // Domyślne kursy (aktualizowane z API NBP, fallback gdy brak internetu)
  // Bufor +5% już wliczony
  RATES: {
    USD_to_PLN: 3.646,   // kurs średni NBP (fallback); nadpisywany przy starcie z API NBP / rates.json
    USD_to_EUR: 0.899,   // 0.8561 × bufor 1.05 (fallback)
    BUFFER: 1.05,
  },

  // Kategorie tłumaczone
  CATEGORY_FIELD: {
    pl: 'kategoria_pl',
    ua: 'kategoria_ua',
    en: 'kategoria_en',
    it: 'kategoria_it',
  },
  NAME_FIELD: {
    pl: 'nazwa_pl',
    ua: 'nazwa_ua',
    en: 'nazwa_en',
    it: 'nazwa_it',
  },
  DESC_FIELD: {
    pl: 'opis_pl',
    ua: 'opis_ua',
    en: 'opis_en',
    it: 'opis_it',
  },
};

// === TŁUMACZENIA UI ===
const I18N = {
  pl: {
    // Navigation
    nav_home: 'Start',
    nav_drones: 'Drony',
    nav_parts: 'Części',
    nav_rental: 'Wynajem',
    nav_hurt: 'Hurt',
    nav_faq: 'FAQ',
    nav_blog: 'Blog',
    nav_about: 'O nas',
    nav_contact: 'Kontakt',
    
    // Cart & shop
    cart: 'Koszyk',
    add_to_cart: 'Do koszyka',
    out_of_stock: 'Brak',
    cart_empty: 'Koszyk jest pusty',
    cart_empty_sub: 'Dodaj części z katalogu',
    subtotal: 'Suma',
    checkout: 'Przejdź do kasy',
    continue_shopping: 'Kontynuuj zakupy',
    added_to_cart: 'Dodano do koszyka',
    remove: 'Usuń',
    quantity: 'Ilość',
    
    // Catalog
    search_placeholder: 'Szukaj części lub kodu...',
    all_models: 'Wszystkie modele',
    all_categories: 'Wszystkie kategorie',
    filter_model: 'Model drona',
    filter_category: 'Kategoria',
    sort_by: 'Sortuj',
    sort_name: 'Po nazwie',
    sort_price_asc: 'Cena rosnąco',
    sort_price_desc: 'Cena malejąco',
    found: 'Znaleziono',
    parts: 'części',
    catalog_title: 'Katalog części',
    catalog_sub: '758 części pasujących do T25, T50, T100',
    
    // Hero & CTAs
    hero_title: 'Części do dronów rolniczych',
    hero_subtitle: 'Profesjonalne części zamienne i wynajem dronów DJI Agras T25, T50, T100',
    hero_btn_catalog: 'Przeglądaj katalog',
    hero_btn_telegram: 'Szukaj części z AI',
    cta_title: 'Nie wiesz, której części szukasz?',
    cta_sub: 'Czat AI znajdzie część po modelu drona, nazwie lub numerze katalogowym i doda ją do koszyka',
    cta_btn: 'Otwórz czat',
    
    // Forms
    name: 'Imię i nazwisko',
    phone: 'Telefon',
    email: 'Email',
    address: 'Adres dostawy',
    city: 'Miasto',
    zip: 'Kod pocztowy',
    country: 'Kraj',
    company: 'Firma',
    nip: 'NIP',
    notes: 'Uwagi',
    order_via_telegram: 'Wyślij zamówienie',
    order_sent: '✅ Dziękujemy! Zamówienie przyjęte. Potwierdzimy dostępność, termin i dane do płatności e-mailem lub telefonicznie.',
    order_error: 'Nie udało się wysłać zamówienia. Spróbuj ponownie albo napisz na order@dronepartshub.eu.',
    cancel: 'Anuluj',
    submit: 'Wyślij',
    save: 'Zapisz',
    required: 'Wymagane',
    
    // Sections
    section_models: 'Modele dronów',
    section_bestsellers: 'Bestsellery',
    section_features: 'Dlaczego my',
    section_videos: 'Galeria filmów',
    section_specs: 'Specyfikacja techniczna',
    
    // Footer
    footer_info: 'Informacje',
    footer_drones: 'Drony',
    footer_contact: 'Kontakt',
    footer_legal: 'Regulamin sklepu',
    footer_privacy: 'Polityka prywatności / RODO',
    footer_returns: 'Zwroty i reklamacje',
    footer_about: 'O nas',
    footer_made: 'Made with 🛸 for agricultural professionals',
    footer_disclaimer: 'Drone Parts Hub jest niezależnym sklepem z częściami zamiennymi do dronów rolniczych. Nazwy modeli T25, T50, T100 są używane wyłącznie w celu identyfikacji kompatybilności produktów.',
    
    // Messages
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    no_results: 'Brak wyników',
    
    // Cookies
    cookies_title: '🍪 Ta strona używa plików cookies',
    cookies_text: 'Używamy cookies aby zapamiętać Twój koszyk, język i preferencje.',
    cookies_necessary: 'Tylko niezbędne',
    cookies_accept: 'Akceptuję wszystkie',
    
    // Live chat
    chat_title: 'PISZ DO NAS',
    chat_text: 'Czat AI znajdzie część po modelu lub numerze katalogowym.',
    chat_btn: 'Otwórz czat',
    chat_other: 'Inne sposoby kontaktu',
  },
  ua: {
    // Navigation
    nav_home: 'Головна',
    nav_drones: 'Дрони',
    nav_parts: 'Запчастини',
    nav_rental: 'Оренда',
    nav_hurt: 'Гурт',
    nav_faq: 'FAQ',
    nav_blog: 'Блог',
    nav_about: 'Про нас',
    nav_contact: 'Контакти',
    
    // Cart & shop
    cart: 'Кошик',
    add_to_cart: 'У кошик',
    out_of_stock: 'Немає',
    cart_empty: 'Кошик порожній',
    cart_empty_sub: 'Додайте запчастини з каталогу',
    subtotal: 'Сума',
    checkout: 'Перейти до оплати',
    continue_shopping: 'Продовжити покупки',
    added_to_cart: 'Додано до кошика',
    remove: 'Видалити',
    quantity: 'Кількість',
    
    // Catalog
    search_placeholder: 'Пошук запчастини або коду...',
    all_models: 'Усі моделі',
    all_categories: 'Усі категорії',
    filter_model: 'Модель дрона',
    filter_category: 'Категорія',
    sort_by: 'Сортувати',
    sort_name: 'За назвою',
    sort_price_asc: 'Ціна за зростанням',
    sort_price_desc: 'Ціна за спаданням',
    found: 'Знайдено',
    parts: 'запчастин',
    catalog_title: 'Каталог запчастин',
    catalog_sub: '758 запчастин для T25, T50, T100',
    
    // Hero & CTAs
    hero_title: 'Запчастини для сільгосп дронів',
    hero_subtitle: 'Професійні запчастини та оренда дронів DJI Agras T25, T50, T100',
    hero_btn_catalog: 'Переглянути каталог',
    hero_btn_telegram: 'Пошук запчастин з AI',
    cta_title: 'Не знаєте, яку запчастину шукаєте?',
    cta_sub: 'Чат AI знайде запчастину за моделлю дрона, назвою або каталожним номером і додасть її в кошик',
    cta_btn: 'Відкрити чат',
    
    // Forms
    name: "Ім'я та прізвище",
    phone: 'Телефон',
    email: 'Email',
    address: 'Адреса доставки',
    city: 'Місто',
    zip: 'Поштовий індекс',
    country: 'Країна',
    company: 'Компанія',
    nip: 'ЄДРПОУ',
    notes: 'Примітки',
    order_via_telegram: 'Надіслати замовлення',
    order_sent: '✅ Дякуємо! Замовлення прийнято. Ми підтвердимо наявність, термін і дані для оплати електронною поштою або телефоном.',
    order_error: 'Не вдалося надіслати замовлення. Спробуйте ще раз або напишіть на order@dronepartshub.eu.',
    cancel: 'Скасувати',
    submit: 'Надіслати',
    save: 'Зберегти',
    required: "Обов'язкове",
    
    // Sections
    section_models: 'Моделі дронів',
    section_bestsellers: 'Бестселери',
    section_features: 'Чому ми',
    section_videos: 'Галерея відео',
    section_specs: 'Технічні характеристики',
    
    // Footer
    footer_info: 'Інформація',
    footer_drones: 'Дрони',
    footer_contact: 'Контакти',
    footer_legal: 'Правила магазину',
    footer_privacy: 'Політика приватності / GDPR',
    footer_returns: 'Повернення та скарги',
    footer_about: 'Про нас',
    footer_made: 'Made with 🛸 for agricultural professionals',
    footer_disclaimer: 'Drone Parts Hub - незалежний магазин запчастин до сільгосп дронів. Назви моделей T25, T50, T100 використовуються виключно з метою ідентифікації сумісності продуктів.',
    
    // Messages
    loading: 'Завантаження...',
    error: 'Помилка',
    success: 'Успіх',
    no_results: 'Немає результатів',
    
    // Cookies
    cookies_title: '🍪 Цей сайт використовує cookies',
    cookies_text: "Ми використовуємо cookies щоб запам'ятати ваш кошик, мову та налаштування.",
    cookies_necessary: 'Тільки необхідні',
    cookies_accept: 'Прийняти всі',
    
    // Live chat
    chat_title: 'НАПИШІТЬ НАМ',
    chat_text: 'Чат AI знайде запчастину за моделлю або номером.',
    chat_btn: 'Відкрити чат',
    chat_other: 'Інші способи зв\'язку',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_drones: 'Drones',
    nav_parts: 'Parts',
    nav_rental: 'Rental',
    nav_hurt: 'Wholesale',
    nav_faq: 'FAQ',
    nav_blog: 'Blog',
    nav_about: 'About',
    nav_contact: 'Contact',
    
    // Cart & shop
    cart: 'Cart',
    add_to_cart: 'Add to cart',
    out_of_stock: 'Out of stock',
    cart_empty: 'Cart is empty',
    cart_empty_sub: 'Add parts from catalog',
    subtotal: 'Subtotal',
    checkout: 'Proceed to checkout',
    continue_shopping: 'Continue shopping',
    added_to_cart: 'Added to cart',
    remove: 'Remove',
    quantity: 'Quantity',
    
    // Catalog
    search_placeholder: 'Search parts or code...',
    all_models: 'All models',
    all_categories: 'All categories',
    filter_model: 'Drone model',
    filter_category: 'Category',
    sort_by: 'Sort by',
    sort_name: 'By name',
    sort_price_asc: 'Price ascending',
    sort_price_desc: 'Price descending',
    found: 'Found',
    parts: 'parts',
    catalog_title: 'Parts Catalog',
    catalog_sub: '758 spare parts for T25, T50, T100',
    
    // Hero & CTAs
    hero_title: 'Agricultural drone parts',
    hero_subtitle: 'Professional spare parts and rental of DJI Agras T25, T50, T100 drones',
    hero_btn_catalog: 'Browse catalog',
    hero_btn_telegram: 'Find parts with AI',
    cta_title: 'Not sure which part you need?',
    cta_sub: 'The AI chat finds parts by drone model, name or part number and adds them to your cart',
    cta_btn: 'Open chat',
    
    // Forms
    name: 'Full name',
    phone: 'Phone',
    email: 'Email',
    address: 'Shipping address',
    city: 'City',
    zip: 'Postal code',
    country: 'Country',
    company: 'Company',
    nip: 'VAT ID',
    notes: 'Notes',
    order_via_telegram: 'Send order',
    order_sent: '✅ Thank you! Order received. We will confirm availability, delivery time and payment details by email or phone.',
    order_error: 'The order could not be sent. Please try again or email order@dronepartshub.eu.',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    required: 'Required',
    
    // Sections
    section_models: 'Drone Models',
    section_bestsellers: 'Best Sellers',
    section_features: 'Why us',
    section_videos: 'Video Gallery',
    section_specs: 'Technical Specifications',
    
    // Footer
    footer_info: 'Information',
    footer_drones: 'Drones',
    footer_contact: 'Contact',
    footer_legal: 'Terms & Conditions',
    footer_privacy: 'Privacy Policy / GDPR',
    footer_returns: 'Returns & Complaints',
    footer_about: 'About us',
    footer_made: 'Made with 🛸 for agricultural professionals',
    footer_disclaimer: 'Drone Parts Hub is an independent shop with spare parts for agricultural drones. Model names T25, T50, T100 are used solely for product compatibility identification purposes.',
    
    // Messages
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    no_results: 'No results',
    
    // Cookies
    cookies_title: '🍪 This site uses cookies',
    cookies_text: 'We use cookies to remember your cart, language and preferences.',
    cookies_necessary: 'Only necessary',
    cookies_accept: 'Accept all',
    
    // Live chat
    chat_title: 'CHAT WITH US',
    chat_text: 'The AI chat finds parts by model or part number.',
    chat_btn: 'Open chat',
    chat_other: 'Other contact methods',
  },
};

// === STATE ===
const STATE = {
  parts: [],
  filteredParts: [],
  cart: [],
  lang: 'pl',
  currentPage: 1,
  filters: {
    search: '',
    model: 'all',
    category: 'all',
    sort: 'name',
  },
};

// === LOCALSTORAGE ===
function saveCart() {
  localStorage.setItem('dji_cart', JSON.stringify(STATE.cart));
  updateCartCount();
}

function loadCart() {
  try {
    STATE.cart = JSON.parse(localStorage.getItem('dji_cart') || '[]');
  } catch { STATE.cart = []; }
  updateCartCount();
}

function getLang() {
  return localStorage.getItem('dji_lang') || (
    navigator.language.startsWith('uk') ? 'ua' :
    navigator.language.startsWith('en') ? 'en' :
    'pl'
  );
}

function setLang(lang) {
  localStorage.setItem('dji_lang', lang);
  STATE.lang = lang;
  applyTranslations();
}

// === TŁUMACZENIA ===
function t(key) {
  return I18N[STATE.lang]?.[key] || I18N.pl[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
  // Update lang button
  const langBtn = document.querySelector('.nav__lang');
  if (langBtn) langBtn.textContent = STATE.lang.toUpperCase();
  document.documentElement.lang = STATE.lang;
}

// === KONWERSJA WALUT ===
function priceUSD(amount) {
  return `$${amount.toFixed(2)}`;
}
function pricePLN(amount) {
  return `${(amount * APP.RATES.USD_to_PLN * APP.RATES.BUFFER).toFixed(2)} zł`;
}
function priceEUR(amount) {
  return `€${(amount * APP.RATES.USD_to_EUR).toFixed(2)}`;
}

function getPrimaryPrice(amount) {
  // PL/UA → PLN, EN → USD, IT → EUR
  if (STATE.lang === 'pl' || STATE.lang === 'ua') return pricePLN(amount);
  return priceUSD(amount);
}

// === LOGIKA KOSZYKA ===
function addToCart(partId) {
  const part = STATE.parts.find(p => p.id == partId);
  if (!part) return;

  const existing = STATE.cart.find(item => item.id == partId);
  if (existing) {
    existing.qty += 1;
  } else {
    STATE.cart.push({
      id: part.id,
      name: part[APP.NAME_FIELD[STATE.lang]],
      catno: part.numer_katalogowy,
      price_usd: part.cena_usd,
      img: part.zdjecie_url,
      model: part.model,
      qty: 1,
    });
  }
  saveCart();
  showToast(t('added_to_cart'));
  renderCartDrawer();
}

function updateCartItemQty(partId, delta) {
  const item = STATE.cart.find(i => i.id == partId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCartDrawer();
}

function removeFromCart(partId) {
  STATE.cart = STATE.cart.filter(i => i.id != partId);
  saveCart();
  renderCartDrawer();
}

function cartTotal() {
  return STATE.cart.reduce((sum, item) => sum + item.price_usd * item.qty, 0);
}

function cartCount() {
  return STATE.cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  const el = document.querySelector('.nav__cart-count');
  if (el) {
    el.textContent = cartCount();
    el.style.display = cartCount() > 0 ? 'inline-block' : 'none';
  }
}

// === RENDEROWANIE KOSZYKA ===
function openCart() {
  renderCartDrawer();
  document.querySelector('.cart-drawer')?.classList.add('open');
  document.querySelector('.cart-drawer__overlay')?.classList.add('show');
}

function closeCart() {
  document.querySelector('.cart-drawer')?.classList.remove('open');
  document.querySelector('.cart-drawer__overlay')?.classList.remove('show');
}

function renderCartDrawer() {
  const body = document.querySelector('.cart-drawer__body');
  const footer = document.querySelector('.cart-drawer__footer');
  if (!body) return;

  if (STATE.cart.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer__empty">
        <div class="cart-drawer__empty-icon">🛒</div>
        <div data-i18n="cart_empty">${t('cart_empty')}</div>
        <p style="margin-top:8px;font-size:14px;" data-i18n="cart_empty_sub">${t('cart_empty_sub')}</p>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = STATE.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__img">
        ${item.img ? `<img src="${item.img}" alt="" onerror="this.outerHTML='🔧';">` : '🔧'}
      </div>
      <div>
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__catno">${item.catno}</div>
        <div class="cart-item__qty">
          <button onclick="updateCartItemQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartItemQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <div>
        <div class="cart-item__price">${getPrimaryPrice(item.price_usd * item.qty)}</div>
        <div class="cart-item__remove" onclick="removeFromCart(${item.id})">🗑</div>
      </div>
    </div>
  `).join('');

  // Update totals
  const total = cartTotal();
  const totalsEl = document.querySelector('.cart-totals');
  if (totalsEl) {
    totalsEl.innerHTML = `
      <div class="cart-total-row">
        <span>${t('subtotal')} USD</span>
        <span class="cart-total-amount">${priceUSD(total)}</span>
      </div>
      <div class="cart-total-row">
        <span>${t('subtotal')} EUR</span>
        <span class="cart-total-amount">${priceEUR(total)}</span>
      </div>
      <div class="cart-total-row grand">
        <span>${t('subtotal')}</span>
        <span class="cart-total-amount">${pricePLN(total)}</span>
      </div>
    `;
  }
}

// === MODAL ZAMÓWIENIA ===
function openOrderModal() {
  if (STATE.cart.length === 0) return;
  const modal = document.querySelector('#orderModal');
  if (modal) modal.classList.add('show');
}

function closeOrderModal() {
  document.querySelector('#orderModal')?.classList.remove('show');
}

function submitOrder(form) {
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const email = data.get('email');
  const address = data.get('address');
  const notes = data.get('notes') || '';

  // Treść zamówienia → Bitrix24 (dph.js → /api/lead)
  let msg = `NOWE ZAMÓWIENIE ze strony WWW\n\n`;
  msg += `Klient: ${name}\nTelefon: ${phone}\nE-mail: ${email}\nAdres: ${address}\n`;
  if (notes) msg += `Uwagi: ${notes}\n`;
  msg += `\nZAMÓWIONE CZĘŚCI:\n`;
  STATE.cart.forEach((item, i) => {
    msg += `\n${i+1}. ${item.name}`;
    msg += `\n   Kod: ${item.catno}`;
    msg += `\n   Model: ${item.model}, Ilość: ${item.qty} szt`;
    msg += `\n   Cena: ${priceUSD(item.price_usd)} / szt (${pricePLN(item.price_usd)})`;
  });
  const total = cartTotal();
  msg += `\n\nSUMA: ${priceUSD(total)} / ${pricePLN(total)} / ${priceEUR(total)}`;

  const btn = form.querySelector('[type=submit]');
  if (btn) btn.disabled = true;
  return DPH.send('order', {
    name, phone, email, message: msg, website: data.get('website') || '',
    total_pln: +(total * APP.RATES.USD_to_PLN * APP.RATES.BUFFER).toFixed(2),
  }).then(ok => {
    if (btn) btn.disabled = false;
    if (!ok) { alert(t('order_error')); return; }
    alert(t('order_sent'));
    STATE.cart = [];
    saveCart();
    closeOrderModal();
    closeCart();
  });
}

// === KATALOG: FILTROWANIE ===
function applyFilters() {
  let filtered = [...STATE.parts];

  if (STATE.filters.search) {
    const q = STATE.filters.search.toLowerCase();
    filtered = filtered.filter(p => {
      const name = (p[APP.NAME_FIELD[STATE.lang]] || '').toLowerCase();
      const cat = (p[APP.CATEGORY_FIELD[STATE.lang]] || '').toLowerCase();
      const catno = (p.numer_katalogowy || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || catno.includes(q);
    });
  }

  if (STATE.filters.model !== 'all') {
    filtered = filtered.filter(p => p.model === STATE.filters.model);
  }

  if (STATE.filters.category !== 'all') {
    filtered = filtered.filter(p =>
      p[APP.CATEGORY_FIELD[STATE.lang]] === STATE.filters.category
    );
  }

  // Sortuj
  if (STATE.filters.sort === 'price_asc') {
    filtered.sort((a, b) => a.cena_usd - b.cena_usd);
  } else if (STATE.filters.sort === 'price_desc') {
    filtered.sort((a, b) => b.cena_usd - a.cena_usd);
  } else {
    filtered.sort((a, b) => {
      const an = a[APP.NAME_FIELD[STATE.lang]] || '';
      const bn = b[APP.NAME_FIELD[STATE.lang]] || '';
      return an.localeCompare(bn);
    });
  }

  STATE.filteredParts = filtered;
  STATE.currentPage = 1;
  renderCatalog();
}

// === RENDER KATALOGU ===
function renderCatalog() {
  const grid = document.querySelector('.products-grid');
  const countEl = document.querySelector('.results-count');
  if (!grid) return;

  if (countEl) {
    countEl.innerHTML = `${t('found')} <strong>${STATE.filteredParts.length}</strong> ${t('parts')}`;
  }

  const start = (STATE.currentPage - 1) * APP.ITEMS_PER_PAGE;
  const end = start + APP.ITEMS_PER_PAGE;
  const pageParts = STATE.filteredParts.slice(start, end);

  if (pageParts.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-muted);">${t('cart_empty')}</p>`;
    return;
  }

  grid.innerHTML = pageParts.map(p => {
    const name = p[APP.NAME_FIELD[STATE.lang]] || p.nazwa_en;
    const cat = p[APP.CATEGORY_FIELD[STATE.lang]] || p.kategoria_en;
    const inStock = p.stan_magazynowy > 0 || true; // Pokaz jako dostępne (admin uzupełnia)

    return `
      <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
        <div class="product-card__img">
          <span class="product-card__model">${p.model}</span>
          ${p.zdjecie_url
            ? `<img src="${p.zdjecie_url}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <div class="product-card__placeholder" style="display:none;">🔧</div>`
            : `<div class="product-card__placeholder">🔧</div>`}
        </div>
        <div class="product-card__body">
          <div class="product-card__catno">${p.numer_katalogowy}</div>
          <div class="product-card__category">${cat}</div>
          <div class="product-card__name">${name}</div>
          <div class="product-card__prices">
            <div class="product-card__price-row primary">
              <span>${STATE.lang === 'pl' || STATE.lang === 'ua' ? 'PLN' : STATE.lang === 'en' ? 'USD' : 'EUR'}</span>
              <span>${getPrimaryPrice(p.cena_usd)}</span>
            </div>
            <div class="product-card__price-row">
              <span>USD</span>
              <span>${priceUSD(p.cena_usd)}</span>
            </div>
            <div class="product-card__price-row">
              <span>EUR</span>
              <span>${priceEUR(p.cena_usd)}</span>
            </div>
          </div>
          <button class="product-card__add" onclick="event.stopPropagation();addToCart(${p.id})">
            ${t('add_to_cart')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderPagination();
}

function renderPagination() {
  const container = document.querySelector('.pagination');
  if (!container) return;

  const totalPages = Math.ceil(STATE.filteredParts.length / APP.ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button class="pagination__btn" onclick="goToPage(${STATE.currentPage - 1})" ${STATE.currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  // Pages
  const max = 7;
  let start = Math.max(1, STATE.currentPage - 3);
  let end = Math.min(totalPages, start + max - 1);
  if (end - start < max - 1) start = Math.max(1, end - max + 1);

  if (start > 1) {
    html += `<button class="pagination__btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span style="align-self:center;color:var(--color-text-muted);">…</span>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="pagination__btn ${i === STATE.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (end < totalPages) {
    if (end < totalPages - 1) html += `<span style="align-self:center;color:var(--color-text-muted);">…</span>`;
    html += `<button class="pagination__btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="pagination__btn" onclick="goToPage(${STATE.currentPage + 1})" ${STATE.currentPage === totalPages ? 'disabled' : ''}>›</button>`;

  container.innerHTML = html;
}

function goToPage(page) {
  STATE.currentPage = page;
  renderCatalog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProductDetails(partId) {
  // Na razie - po prostu dodaje do koszyka
  // Można rozszerzyć o modal ze szczegółami
  addToCart(partId);
}

// === FILTERS UI ===
function renderFilters() {
  const filtersEl = document.querySelector('.filters');
  if (!filtersEl) return;

  // Modele
  const models = [...new Set(STATE.parts.map(p => p.model))].sort();
  const modelCounts = {};
  models.forEach(m => modelCounts[m] = STATE.parts.filter(p => p.model === m).length);

  // Kategorie
  const categories = [...new Set(STATE.parts.map(p => p[APP.CATEGORY_FIELD[STATE.lang]]))].filter(Boolean).sort();
  const catCounts = {};
  categories.forEach(c => catCounts[c] = STATE.parts.filter(p => p[APP.CATEGORY_FIELD[STATE.lang]] === c).length);

  filtersEl.innerHTML = `
    <div class="search-box">
      <input type="text" placeholder="${t('search_placeholder')}" oninput="STATE.filters.search=this.value;applyFilters()">
    </div>

    <div class="filters__group">
      <div class="filters__title">${t('filter_model')}</div>
      <label class="filters__option">
        <input type="radio" name="model" value="all" ${STATE.filters.model === 'all' ? 'checked' : ''} onchange="STATE.filters.model='all';applyFilters()">
        <span>${t('all_models')}</span>
        <span class="filters__count">${STATE.parts.length}</span>
      </label>
      ${models.map(m => `
        <label class="filters__option">
          <input type="radio" name="model" value="${m}" onchange="STATE.filters.model='${m}';applyFilters()">
          <span>${m}</span>
          <span class="filters__count">${modelCounts[m]}</span>
        </label>
      `).join('')}
    </div>

    <div class="filters__group">
      <div class="filters__title">${t('filter_category')}</div>
      <label class="filters__option">
        <input type="radio" name="cat" value="all" ${STATE.filters.category === 'all' ? 'checked' : ''} onchange="STATE.filters.category='all';applyFilters()">
        <span>${t('all_categories')}</span>
      </label>
      ${categories.slice(0, 15).map(c => `
        <label class="filters__option">
          <input type="radio" name="cat" value="${c}" onchange="STATE.filters.category='${c}';applyFilters()">
          <span>${c}</span>
          <span class="filters__count">${catCounts[c]}</span>
        </label>
      `).join('')}
    </div>
  `;
}

// === TOAST ===
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// === LANG SWITCH ===
function toggleLang() {
  const langs = ['pl', 'ua', 'en'];
  const idx = langs.indexOf(STATE.lang);
  setLang(langs[(idx + 1) % langs.length]);
  // Re-render w zależności od strony
  if (document.querySelector('.products-grid')) {
    renderFilters();
    applyFilters();
  }
  if (document.querySelector('.cart-drawer.open')) {
    renderCartDrawer();
  }
}

// === INIT ===
// Aktualny kurs: API NBP (tabela A, kurs średni) → rates.json → wartości domyślne
async function loadRates() {
  const set = (usdPln, eurPln) => {
    if (usdPln > 0 && eurPln > 0) {
      APP.RATES.USD_to_PLN = usdPln;
      APP.RATES.USD_to_EUR = (usdPln / eurPln) * APP.RATES.BUFFER;
      return true;
    }
    return false;
  };
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json', { signal: ctl.signal });
    if (r.ok) {
      const t = (await r.json())[0].rates;
      const mid = c => (t.find(x => x.code === c) || {}).mid;
      if (set(mid('USD'), mid('EUR'))) return;
    }
  } catch (e) {}
  try {
    const r = await window._origFetchRates('rates.json');
    if (r.ok) { const j = await r.json(); set(j.usd_pln, j.eur_pln); }
  } catch (e) {}
}

async function init() {
  await loadRates();
  STATE.lang = getLang();
  loadCart();

  // Załaduj części - tylko gdy jest dedykowana strona katalogu
  // (sprawdzamy .filters lub .pagination - bestsellery na index nie mają tych)
  const isCatalogPage = document.querySelector('.filters') || document.querySelector('.pagination');
  
  if (isCatalogPage) {
    try {
      console.log('📦 Ładowanie 758 części z parts.json...');
      const res = await fetch('parts.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      STATE.parts = await res.json();
      STATE.filteredParts = [...STATE.parts];
      console.log('✅ Załadowano ' + STATE.parts.length + ' części');

      renderFilters();
      renderCatalog();
    } catch (e) {
      console.error('❌ Błąd ładowania części:', e);
      const grid = document.querySelector('.products-grid');
      if (grid) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px;color:#ff6b6b;">⚠️ Błąd ładowania części. Sprawdź czy plik parts.json jest dostępny.<br><br>Spróbuj odświeżyć stronę (F5).</p>';
      }
    }
  }

  applyTranslations();
}

document.addEventListener('DOMContentLoaded', init);

// === COOKIES BANNER ===
function initCookiesBanner() {
  if (localStorage.getItem('dji_cookies_consent')) return; // Już zaakceptowano
  
  const banner = document.createElement('div');
  banner.className = 'cookies-banner';
  banner.innerHTML = `
    <div class="cookies-banner__inner">
      <div class="cookies-banner__text">
        <strong>🍪 Ta strona używa plików cookies</strong>
        Używamy cookies aby zapamiętać Twój koszyk, język i preferencje.
        Możesz przeczytać szczegóły w naszej <a href="polityka-prywatnosci.html">Polityce prywatności</a>.
      </div>
      <div class="cookies-banner__buttons">
        <button class="cookies-btn cookies-btn--ghost" onclick="acceptCookies('necessary')">Tylko niezbędne</button>
        <button class="cookies-btn cookies-btn--primary" onclick="acceptCookies('all')">Akceptuję wszystkie</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('show'), 500);
}

function acceptCookies(type) {
  localStorage.setItem('dji_cookies_consent', type);
  localStorage.setItem('dji_cookies_date', new Date().toISOString());
  const banner = document.querySelector('.cookies-banner');
  if (banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 400);
  }
}

// Uruchom banner po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initCookiesBanner, 1000);
});

// === HAMBURGER MENU dla mobile ===
function toggleMobileMenu() {
  const menu = document.querySelector('.nav__menu');
  const burger = document.querySelector('.nav__hamburger');
  if (menu && burger) {
    menu.classList.toggle('mobile-open');
    burger.classList.toggle('active');
  }
}

// Inject hamburger button
document.addEventListener('DOMContentLoaded', () => {
  const navInner = document.querySelector('.nav__inner');
  const navMenu = document.querySelector('.nav__menu');
  if (navInner && navMenu && !document.querySelector('.nav__hamburger')) {
    const burger = document.createElement('button');
    burger.className = 'nav__hamburger';
    burger.setAttribute('aria-label', 'Menu');
    burger.onclick = toggleMobileMenu;
    burger.innerHTML = '<span></span><span></span><span></span>';
    // Wstaw przed nav__menu
    navInner.insertBefore(burger, navMenu);
  }
});

// === LANG SELECTOR z flagami ===
const LANG_LABELS = {
  pl: { flag: '🇵🇱', name: 'Polski' },
  ua: { flag: '🇺🇦', name: 'Українська' },
  en: { flag: '🇬🇧', name: 'English' },
};

function buildLangSelector() {
  const oldBtn = document.querySelector('.nav__lang');
  if (!oldBtn || document.querySelector('.lang-selector')) return;
  
  const currentLang = STATE.lang || 'pl';
  const current = LANG_LABELS[currentLang];
  
  const selector = document.createElement('div');
  selector.className = 'lang-selector';
  selector.innerHTML = `
    <button class="lang-selector__trigger" onclick="toggleLangDropdown(event)">
      <span class="lang-selector__flag">${current.flag}</span>
      <span>${currentLang.toUpperCase()}</span>
      <span class="lang-selector__arrow">▼</span>
    </button>
    <div class="lang-selector__dropdown">
      ${Object.keys(LANG_LABELS).map(lang => {
        const l = LANG_LABELS[lang];
        return `<button class="lang-selector__option ${lang === currentLang ? 'active' : ''}" onclick="selectLang('${lang}')">
          <span class="lang-selector__flag">${l.flag}</span>
          <span>${l.name}</span>
          <span class="lang-selector__check">✓</span>
        </button>`;
      }).join('')}
    </div>
  `;
  
  oldBtn.replaceWith(selector);
}

function toggleLangDropdown(e) {
  e?.stopPropagation();
  const sel = document.querySelector('.lang-selector');
  if (sel) sel.classList.toggle('open');
}

function selectLang(lang) {
  setLang(lang);
  
  // Aktualizuj wygląd selektora
  const selector = document.querySelector('.lang-selector');
  if (selector) {
    const trigger = selector.querySelector('.lang-selector__trigger');
    const l = LANG_LABELS[lang];
    trigger.innerHTML = `
      <span class="lang-selector__flag">${l.flag}</span>
      <span>${lang.toUpperCase()}</span>
      <span class="lang-selector__arrow">▼</span>
    `;
    selector.querySelectorAll('.lang-selector__option').forEach(opt => {
      opt.classList.remove('active');
    });
    selector.querySelector(`[onclick="selectLang('${lang}')"]`)?.classList.add('active');
    selector.classList.remove('open');
  }
  
  // Re-render w zależności od strony
  if (document.querySelector('.products-grid')) {
    if (typeof renderFilters === 'function') renderFilters();
    if (typeof applyFilters === 'function') applyFilters();
  }
  if (document.querySelector('.cart-drawer.open')) {
    if (typeof renderCartDrawer === 'function') renderCartDrawer();
  }
  // Re-render bestsellers
  if (typeof loadBestsellers === 'function' && document.getElementById('bestsellersGrid')) {
    loadBestsellers();
  }
  // Re-render product page
  if (typeof loadProduct === 'function' && document.getElementById('productContent')) {
    loadProduct();
  }
}

// Zamknij dropdown po kliknięciu poza
document.addEventListener('click', (e) => {
  const sel = document.querySelector('.lang-selector');
  if (sel && !sel.contains(e.target)) {
    sel.classList.remove('open');
  }
});

// Inicjalizacja przy ładowaniu
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(buildLangSelector, 50);
});

// === Auto-detect języka przeglądarki przy pierwszej wizycie ===
function autoDetectLang() {
  if (localStorage.getItem('dji_lang')) return; // User już wybrał
  
  const browserLang = navigator.language || navigator.userLanguage || 'pl';
  const code = browserLang.split('-')[0].toLowerCase();
  
  let detected = 'pl';
  if (code === 'uk' || code === 'ua' || code === 'ru') detected = 'ua';
  else if (code === 'en' || code === 'de' || code === 'fr' || code === 'it' || code === 'es') detected = 'en';
  
  if (detected !== 'pl') {
    setLang(detected);
    setTimeout(() => {
      showToast(`🌍 ${detected === 'ua' ? 'Мова автоматично змінена на українську' : 'Language auto-changed to English'}`);
    }, 1500);
  }
}

// Wywołaj auto-detect po załadowaniu
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(autoDetectLang, 100);
});

// === Pokaż info gdy strona statyczna nie jest pełni przetłumaczona ===
function showLangNotice() {
  if (STATE.lang === 'pl') return;
  
  // Lista stron które mają tylko polskie pełne treści (do przyszłego tłumaczenia)
  const polishOnlyPages = ['regulamin', 'polityka-prywatnosci', 'zwroty-reklamacje', 'faq', 'hurt', 'about', 'blog'];
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '').split('-')[0];
  
  if (polishOnlyPages.includes(currentPage) && !document.getElementById('langNotice')) {
    const notice = document.createElement('div');
    notice.id = 'langNotice';
    notice.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#c8a032;color:black;padding:10px 20px;border-radius:6px;z-index:8000;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-size:13px;font-weight:600;display:flex;align-items:center;gap:12px;max-width:90%;';
    
    const msg = STATE.lang === 'ua' 
      ? "⚠️ Текст цієї сторінки доступний лише польською. Скористайтеся чатом AI або напишіть на order@dronepartshub.eu."
      : "⚠️ Full content of this page available only in Polish. Use the AI chat or email order@dronepartshub.eu.";
    
    notice.innerHTML = `
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()" style="background:black;color:white;border:none;padding:4px 10px;border-radius:3px;cursor:pointer;font-weight:700;">×</button>
    `;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 8000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(showLangNotice, 2000);
});

// === BEZPIECZNIK - jeśli katalog się nie załadował po 2 sek, wymuś ładowanie ===
setTimeout(() => {
  const grid = document.querySelector('.products-grid');
  const filtersAside = document.querySelector('.filters');
  
  if (filtersAside && grid && grid.children.length === 0) {
    console.warn('⚠️ Katalog nie załadowany - wymuszam ładowanie z EMBEDDED_PARTS');
    
    if (window.EMBEDDED_PARTS) {
      STATE.parts = window.EMBEDDED_PARTS;
      STATE.filteredParts = [...STATE.parts];
      console.log('✅ Załadowano ' + STATE.parts.length + ' części z EMBEDDED_PARTS');
      
      if (typeof renderFilters === 'function') renderFilters();
      if (typeof renderCatalog === 'function') renderCatalog();
      if (typeof applyTranslations === 'function') applyTranslations();
    } else {
      console.error('❌ EMBEDDED_PARTS nie jest dostępne');
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px;color:#ff6b6b;">⚠️ Błąd ładowania części. Odśwież stronę (Ctrl+F5).</p>';
    }
  }
}, 2000);
