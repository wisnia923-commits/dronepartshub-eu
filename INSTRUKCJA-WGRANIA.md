# 🚀 INSTRUKCJA WGRANIA – DronePartsHub.eu

## Co naprawiamy
1. **Mało części** (758) → **1537** (dwa razy więcej, prawdziwe SKU DJI Agras)
2. **Zły kurs** (4,20 × 1,05 = 4,41 zł/USD) → **kurs średni NBP 3,6460 zł/USD**
   - tabela 083/A/NBP/2026 z dnia 30.04.2026
   - klienci zobaczą ceny **niższe o ~17%** (uczciwy kurs)

---

## 📦 Co masz w pakiecie

| Plik | Co robi | Akcja |
|---|---|---|
| **`parts.json`** | nowa baza 1537 części, każda z polami w 4 językach (PL/UA/EN/CN) | **PODMIEŃ** stary plik na GitHub |
| **`rates.json`** | aktualny kurs NBP (USD/PLN, EUR/PLN) | **DODAJ** nowy plik do repo |
| **`index.html`** | naprawiony kurs + zaktualizowane liczby (758 → 1537) | **PODMIEŃ** stary plik |
| **`app-js-PATCH-NBP.js`** | patch do app.js – dynamiczne ładowanie kursu z rates.json | wklej na górę `app.js` (instrukcja niżej) |

---

## 🔧 Krok po kroku (5 minut)

### 1. Wgraj 3 nowe pliki na GitHub

Wejdź na: `https://github.com/wisnia923-commits/dronepartshub-eu`

1. Klik **`parts.json`** → **edytuj (ołówek)** → wybierz "Replace file" lub usuń zawartość i wklej nową
   - LUB prościej: usuń stary, **Add file → Upload files** → wgraj nowy `parts.json`
2. **Add file → Upload files** → wgraj `rates.json` (nowy plik)
3. Klik **`index.html`** → **edytuj** → wklej zawartość nowego `index.html`

Commit message: `update: 1537 parts + NBP exchange rate`

### 2. Patch do app.js (jeśli chcesz pełną integrację)

Plik `app.js` jest na GitHubie ale nie ma go w obecnej paczce projektu, więc:

1. Otwórz `app.js` na GitHubie
2. **Skopiuj zawartość `app-js-PATCH-NBP.js`** (cały plik)
3. **Wklej go NA SAMEJ GÓRZE** `app.js` (przed istniejącym kodem)
4. Commit

To doda automatyczne ładowanie kursu z rates.json przy każdym wejściu klienta.

### 3. Czekaj 2 minuty

GitHub Pages auto-deploy. Po ~2 minutach wejdź na `dronepartshub.eu` i sprawdź:
- W stopce / katalogu: **1537 części** zamiast 758
- Ceny w PLN: dla części $1.07 powinno być **3.90 zł** (zamiast wcześniej 4.71 zł)

---

## 📊 Co dokładnie zmienione

### parts.json
- **Stare 758** rekordów: zachowane, dodane brakujące pola `nazwa_cn`, `opis_cn`, `kategoria_cn`
- **Nowe 779** rekordów: prawdziwe SKU DJI Agras pokrywające:
  - Akumulatory (DB1560, DB1580, DB2080, DB2160), ładowarki C8000, generatory D6000i/D12000iEP
  - Pompy (T25/T50/T100), zbiorniki (30L/40L/75L), system rozsiewacza
  - Dysze (XR110, IK90, LU90, TX-VK1, XR-DA) - 15 typów
  - Silniki 9010/10033/11036/12036, śmigła R6515/R6510/R7115/R8014, ESC 60A/80A/100A/120A
  - Ramiona M1/M2/M3/M4 dla każdego modelu
  - GPS RTK D-RTK 2 PRO, radary fazowane, czujniki ToF/IMU
  - Aparatura DJI RC Plus, kamery FPV, oświetlenie LED
  - Eksploatacja: O-ringi (15 rozmiarów), łożyska (11 typów), śruby M2-M6 (30 typów), nakrętki, podkładki

Wszystkie 1537 rekordów ma pełen komplet pól wymaganych z preferencji:
**SKU + nazwa_pl + nazwa_en + nazwa_ua + nazwa_cn + opis_pl + opis_en + opis_ua + opis_cn**

### Kurs USD/PLN
- **Było:** `cena_usd × 4.20 × 1.05 = cena_usd × 4.41` (hardcoded, +21% nad NBP)
- **Jest:** `cena_usd × USD_TO_PLN`, gdzie `USD_TO_PLN = 3.6460` z NBP
- Wartość ładowana dynamicznie z `rates.json` (z fallbackiem na 3.6460)
- Jeśli wgrasz patch do `app.js` – cała strona (product.html, hurt.html) też zacznie używać NBP

---

## ✅ Test po wdrożeniu

Otwórz konsolę przeglądarki (F12) na `dronepartshub.eu`. Powinno pokazać:
```
✅ Kurs NBP załadowany: {usd_pln: 3.646, eur_pln: 4.2589, ...}
✅ Bestsellery: załadowano 1537 części
```

Jeśli widać 758 lub kurs 4.20 – plik nie zostal wgrany / cache przeglądarki (Ctrl+Shift+R).
