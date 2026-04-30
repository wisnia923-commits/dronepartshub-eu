# Drone Parts Hub — dronepartshub.eu

Sklep z częściami zamiennymi do dronów rolniczych DJI Agras T25, T50, T100.

## Stack

- **Hosting:** GitHub Pages (darmowy)
- **Domena:** dronepartshub.eu
- **Frontend:** czysty HTML/CSS/JS (bez frameworków)
- **Baza:** `parts.json` — 758 części
- **Multi-language:** PL / EN
- **Multi-currency:** PLN / EUR / USD
- **Bot Telegram:** @dji_agras_parts_bot (kanał zamówień)

## Struktura plików

```
/
├── index.html              # Strona główna
├── catalog.html            # Katalog z filtrami
├── product.html            # Szczegóły części (?sku=XXX)
├── checkout.html           # Finalizacja zamówienia
├── contact.html            # Kontakt
├── about.html              # O firmie
├── hurt.html               # Hurt B2B
├── rental.html             # Wynajem T50
├── faq.html                # FAQ
├── blog.html               # Blog
├── blog-jak-wybrac-baterie.html
├── blog-przepisy-2026.html
├── blog-kupic-czy-wynajac.html
├── regulamin.html
├── polityka-prywatnosci.html
├── zwroty-reklamacje.html
├── INSTRUKCJA-google-analytics.html
│
├── style.css               # Style (czarno-złoty, #c8a032)
├── app.js                  # Logika (koszyk, filtry, multi-lang, kursy)
├── parts.json              # 758 części (PL/UA/EN nazwy + ceny USD)
│
├── sitemap.xml             # SEO
├── robots.txt              # SEO
├── CNAME                   # GitHub Pages custom domain
└── README.md               # Ten plik
```

## Deploy na GitHub Pages

1. Wgraj wszystkie pliki do repo `wisnia923-commits/dronepartshub-eu` (główny katalog)
2. Settings → Pages → Source: `Deploy from a branch` / Branch: `main` / Folder: `/ (root)` → Save
3. Settings → Pages → Custom domain: `dronepartshub.eu` → Save
4. ✅ Plik `CNAME` w repo już zawiera tę domenę
5. W AfterMarket.pl ustaw rekordy DNS:
   ```
   A     @     185.199.108.153
   A     @     185.199.109.153
   A     @     185.199.110.153
   A     @     185.199.111.153
   CNAME www   wisnia923-commits.github.io.
   ```
6. Czekaj 30 min – 24h na propagację DNS
7. W Settings → Pages zaznacz „Enforce HTTPS"

## Aktualizacja bazy części

Edytuj `parts.json` w GitHub (Edit → wklej nowe → Commit) — strona automatycznie się odświeży po ~1 min.

Struktura rekordu:
```json
{
  "id": 1,
  "model": "T100",
  "kategoria_pl": "Przyciski i pokrętła",
  "kategoria_en": "Buttons & Dials",
  "kategoria_ua": "Кнопки",
  "nazwa_pl": "Przycisk migawki",
  "nazwa_en": "Shutter Button",
  "nazwa_ua": "Кнопка затвору",
  "numer_katalogowy": "YC.JG.ZS001730",
  "cena_usd": 1.07,
  "stan_magazynowy": 0,
  "opis_pl": "...",
  "opis_en": "...",
  "opis_ua": "...",
  "zdjecie_url": "https://..."
}
```

## Co jeszcze do zrobienia

- [ ] Dodać zdjęcia hero (folder `/images/`): `kv.jpg`, `Two_Drone_KV_PC.jpg`, `T100_Lychee.jpg`
- [ ] Uzupełnić dane firmy w `regulamin.html` ([DANE FIRMY], [TWÓJ NIP])
- [ ] Uzupełnić numer telefonu w `contact.html`
- [ ] Wkleić ID Google Analytics 4 (instrukcja w `INSTRUKCJA-google-analytics.html`)
- [ ] Zgłosić sitemap.xml w Google Search Console

## Bot Telegram

`@dji_agras_parts_bot` — checkout strony kopiuje zamówienie do schowka i otwiera bota, klient wkleja → Ty potwierdzasz cenę i wysyłkę.

---
**Stack: lekki, szybki, ~50 zł/rok (sama domena). Hosting i SSL gratis na GitHub Pages.**
