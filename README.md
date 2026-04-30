# 🛸 Drone Parts Hub - Sklep części DJI Agras

Sklep online z częściami zamiennymi do dronów rolniczych DJI Agras, zintegrowany z botem Telegram.

🌐 **Strona:** [dronepartshub.eu](https://dronepartshub.eu)  
🤖 **Bot Telegram:** [@dji_agras_parts_bot](https://t.me/dji_agras_parts_bot)

## 📊 Baza części

✅ **2 168 unikalnych części** w bazie  
✅ Aktualizowana z bota Telegram (Twojego źródła)  
✅ Multi-language: PL / UA / EN / IT  
✅ Multi-currency: USD / PLN / EUR

### 📦 Podział na modele:

| Model | Liczba części |
|-------|--------------:|
| T25 | 1 034 |
| T10 | 867 |
| T70P | 155 |
| D6000I | 112 |
| **RAZEM** | **2 168** |

## 📁 Struktura plików

| Plik | Opis |
|------|------|
| `index.html` | Strona główna (landing) |
| `catalog.html` | Katalog 2168 części z filtrami |
| `product.html` | Szczegóły pojedynczego produktu |
| `checkout.html` | Finalizacja zamówienia |
| `cart.html` | Koszyk |
| `contact.html` | Kontakt z firmą |
| `about.html` | O firmie |
| `hurt.html` | Oferta hurtowa B2B |
| `rental.html` | Wynajem dronów |
| `faq.html` | Najczęstsze pytania |
| `blog.html` | Blog (3 artykuły SEO) |
| `regulamin.html` | Regulamin sklepu |
| `polityka-prywatnosci.html` | RODO |
| `zwroty-reklamacje.html` | Polityka zwrotów |
| `style.css` | Style (czarno-złoty motyw premium) |
| `app.js` | Logika sklepu (koszyk, kursy, języki, filtry) |
| `parts.json` | Baza 2168 części (eksport z bota Telegram) |
| `sitemap.xml` | Sitemap dla Google |
| `robots.txt` | Reguły dla crawlerów |

## 🌟 Funkcjonalności

✅ **Responsive** - desktop, tablet, mobile  
✅ **Multi-language PL/UA/EN/IT** (jak w bocie)  
✅ **Multi-currency USD/PLN/EUR** (kursy NBP +5% bufor)  
✅ **Koszyk localStorage** (zostaje po zamknięciu)  
✅ **Filtry** - po modelu, kategorii, wyszukiwarka SKU  
✅ **Zamawianie** - przekierowanie do bota Telegram  
✅ **Paginacja** - 24 części na stronie  
✅ **Blog SEO** - 3 artykuły o tematyce dronów  
✅ **Wynajem dronów** - osobna sekcja  
✅ **B2B Hurt** - oferta dla operatorów  
✅ **Live chat** - przycisk w prawym dolnym rogu

## 🚀 Wdrożenie - GitHub Pages

### Krok 1: Repo gotowe
✅ Username: `wisnia923-commits`  
✅ Repo: `dronepartshub-eu`

### Krok 2: Wgraj wszystkie pliki
Add file → Upload files → drag & drop → Commit

### Krok 3: Włącz GitHub Pages
Settings → Pages → Source: main / root → Save

### Krok 4: Test pod adresem
```
https://wisnia923-commits.github.io/dronepartshub-eu/
```

### Krok 5: Custom domain (po DNS)
Settings → Pages → Custom domain → `dronepartshub.eu`

## 🌍 Konfiguracja DNS dla dronepartshub.eu

W panelu AfterMarket.pl ustaw rekordy:

```
A     @       185.199.108.153
A     @       185.199.109.153
A     @       185.199.110.153
A     @       185.199.111.153
CNAME www     wisnia923-commits.github.io.
```

⚠️ **PAMIĘTAJ:** Kropka na końcu CNAME jest wymagana w AfterMarket!

## 🔄 Aktualizacja produktów (regularne)

Gdy dodasz nowe części przez bota:

1. W bocie: 📥 Export to JSON (lub CSV)
2. Pobierz świeży `parts.json`
3. W repo GitHub: edytuj `parts.json` → Commit
4. Strona automatycznie się aktualizuje (~30 sek)

## 🛒 Flow zamówienia

```
Klient → strona → koszyk → "Złóż zamówienie"
   ↓
formularz (imię, adres, kontakt)
   ↓
"Wyślij przez Telegram" → bot otwiera się
   ↓
zamówienie kopiowane do schowka klienta
   ↓
klient wkleja w czacie z botem
   ↓
TY widzisz w panelu admina bota
```

## ⚙️ Konfiguracja przed wdrożeniem

### W `app.js` linia 13:
```js
TELEGRAM_BOT: 'https://t.me/dji_agras_parts_bot',
```

### W `index.html`, `catalog.html`, `contact.html`:
- Email: `contact@dronepartshub.eu`
- Telefon: `+48 ___ ___ ___` → Twój numer
- Dane firmy: NIP, adres (w `regulamin.html`)

## 📊 Google Analytics

Patrz: `INSTRUKCJA-google-analytics.html` - krok po kroku.

## 📞 Wsparcie

Bot Telegram: [@dji_agras_parts_bot](https://t.me/dji_agras_parts_bot)

---

**© 2026 Drone Parts Hub** · Sklep części DJI Agras · PL · EU · UA
