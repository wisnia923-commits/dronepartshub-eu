# 📋 INSTRUKCJA AKTUALIZACJI - 2168 części

## ✅ Co masz w tym pakiecie:

```
📦 PAKIET DO WGRANIA NA GITHUB:
├── parts.json           ← 2168 części z bota (uzupełnione tłumaczenia PL)
├── README.md            ← zaktualizowany (758 → 2168)
├── sitemap.xml          ← dronepartshub.eu, daty 2026-04
└── robots.txt           ← dronepartshub.eu
```

## 🎯 Co zrobić:

### KROK 1: Wgraj pakiet do GitHub repo

W repo `dronepartshub-eu`:

1. Otwórz `parts.json` → klik ołówek (Edit)
2. **USUŃ całą zawartość** (Ctrl+A → Delete)
3. **WKLEJ nowy parts.json** (z tego pakietu)
4. Commit message: `Update: 2168 parts from bot`
5. Commit changes

Powtórz dla:
- `README.md`
- `sitemap.xml`
- `robots.txt`

### KROK 2: Zaktualizuj liczby w HTML (opcjonalnie)

W plikach HTML jest "758 części" - możemy zmienić na "2168":

**Plik: `index.html`** - znajdź i zamień:
```
758 części    →    2 168 części
```

**Plik: `catalog.html`** - to samo:
```
758 części    →    2 168 części
```

**Plik: `app.js`** - sprawdź czy ładuje `parts.json` poprawnie

### KROK 3: Sprawdź modele w stronie

Stara strona miała: T25, T50, T100  
Nowa baza ma: **T25, T10, T70P, D6000I**

Może być potrzeba update:
- `index.html` - sekcja "Wybierz model"
- `catalog.html` - filtry modeli

⚠️ NIE martw się tym TERAZ - najpierw deploy, potem update.

## 📊 Po wgraniu - co zobaczysz na stronie:

```
✅ 2168 części z aktualnej bazy bota
✅ Wszystkie z statusem "Zapytaj o cenę" (bo brak cen w bazie)
✅ Klient pyta przez bota Telegram
✅ Filtry działają: T25 (1034), T10 (867), T70P (155), D6000I (112)
```

## 🚀 Następne kroki:

1. ✅ Wgraj pakiet do GitHub
2. ✅ Włącz GitHub Pages
3. ✅ Test pod adresem `wisnia923-commits.github.io/dronepartshub-eu/`
4. ✅ Dodaj custom domain `dronepartshub.eu`
5. ✅ DNS w AfterMarket (4x A + CNAME www)
6. ✅ Czekaj 1-24h na propagację
7. ✅ SKLEP DZIAŁA!

## ❓ Pytania?

Wrzuć screenshoty z każdego kroku - sprawdzę i naprowadzę! 💪

---

**© 2026 Drone Parts Hub** · 2168 części · PL · EU · UA
