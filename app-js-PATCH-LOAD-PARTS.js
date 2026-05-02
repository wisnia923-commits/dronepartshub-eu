/* ═════════════════════════════════════════════════════════════════════
 *  PATCH: ŁADOWANIE parts.json — DronePartsHub.eu
 *  ─────────────────────────────────────────────────────────────────────
 *  Zastępuje hardcoded EMBEDDED_PARTS (758 części) świeżymi danymi
 *  pobieranymi z pliku parts.json (1537 części).
 *
 *  GDZIE WKLEIĆ:
 *  Wklej ten cały kod NA SAMEJ GÓRZE pliku app.js — PRZED definicją
 *  `EMBEDDED_PARTS = [...]`. Patch zostanie wykonany przed resztą skryptu.
 *
 *  JAK DZIAŁA:
 *  1. Robi synchroniczne XHR do parts.json (blokuje wątek na ~200ms)
 *  2. Jeśli pobierze poprawnie - ustawia window.EMBEDDED_PARTS
 *  3. Reszta app.js sprawdza `EMBEDDED_PARTS` lub `window.EMBEDDED_PARTS`
 *     i znajduje już 1537 świeżych części
 *  4. Jeśli fetch padnie - fallback na zaszytą bazę 758 (bez awarii)
 * ═════════════════════════════════════════════════════════════════════ */

(function loadFreshParts() {
  // Cache buster - zawsze świeży plik, nie z cache przeglądarki
  var url = 'parts.json?v=' + Date.now();

  try {
    // Synchroniczne XHR (deprecated ale działa - daje gwarancję
    // że dane będą gotowe przed wykonaniem dalszego kodu app.js)
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);  // false = sync
    xhr.send(null);

    if (xhr.status >= 200 && xhr.status < 300) {
      var data = JSON.parse(xhr.responseText);

      if (Array.isArray(data) && data.length > 0) {
        // Nadpisz - reszta app.js użyje już tych danych
        window.EMBEDDED_PARTS = data;

        // Globalna flaga + log dla debug
        window.__PARTS_LOADED_FROM_JSON = true;
        window.__PARTS_COUNT = data.length;

        console.log('✅ Załadowano parts.json:', data.length, 'części');
        console.log('   T100:', data.filter(function(p){return p.model==='T100';}).length);
        console.log('   T50:', data.filter(function(p){return p.model==='T50';}).length);
        console.log('   T25P:', data.filter(function(p){return p.model==='T25P';}).length);
      } else {
        console.warn('⚠️ parts.json pusty lub niepoprawny - używam EMBEDDED_PARTS');
      }
    } else {
      console.warn('⚠️ parts.json HTTP ' + xhr.status + ' - używam EMBEDDED_PARTS');
    }
  } catch (e) {
    console.warn('⚠️ Błąd ładowania parts.json (' + e.message + ') - używam EMBEDDED_PARTS');
  }
})();

/* ═════════════════════════════════════════════════════════════════════
 *  Również: Pobieranie kursu NBP z rates.json (jeśli istnieje)
 * ═════════════════════════════════════════════════════════════════════ */

window.APP = window.APP || {};
window.APP.RATES = window.APP.RATES || {
  USD_to_PLN: 3.6460,   // NBP fallback
  EUR_to_PLN: 4.2589,
  USD_to_EUR: 0.8561,
  date: '2026-04-30',
  source: 'NBP fallback'
};

(function loadRates() {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'rates.json?v=' + Date.now(), false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300) {
      var r = JSON.parse(xhr.responseText);
      if (r.usd_pln && r.usd_pln > 2 && r.usd_pln < 8) {
        window.APP.RATES.USD_to_PLN = r.usd_pln;
      }
      if (r.eur_pln && r.eur_pln > 3 && r.eur_pln < 8) {
        window.APP.RATES.EUR_to_PLN = r.eur_pln;
      }
      if (r.usd_eur) window.APP.RATES.USD_to_EUR = r.usd_eur;
      if (r.date) window.APP.RATES.date = r.date;
      if (r.source) window.APP.RATES.source = r.source;
      console.log('✅ Kurs NBP', r.date, '· USD/PLN', r.usd_pln);
    }
  } catch (e) {
    console.warn('⚠️ rates.json niedostępny - kurs domyślny 3.6460');
  }
})();

/* ═════════════════════════════════════════════════════════════════════
 *  KONIEC PATCHA — poniżej zachowaj istniejący kod app.js
 *  (EMBEDDED_PARTS będzie już nadpisany jeśli parts.json się załadował)
 * ═════════════════════════════════════════════════════════════════════ */
