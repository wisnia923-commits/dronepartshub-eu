/* ═════════════════════════════════════════════════════════════════════
 *  KURS NBP – PATCH DO app.js
 *  ─────────────────────────────────────────────────────────────────────
 *  Wklej CAŁY ten kod NA SAMEJ GÓRZE pliku app.js (przed istniejącym
 *  kodem). Zmieni hardcoded kurs na dynamiczny kurs średni NBP.
 *
 *  WAŻNE: po wklejeniu znajdź w app.js miejsca gdzie jest:
 *    - 4.20 (stary hardcoded kurs)
 *    - 4.41 (4.20 × 1.05)
 *    - APP.RATES.USD_to_PLN = (jakaś liczba)
 *  i zamień je na  APP.RATES.USD_to_PLN  (bez przypisywania wartości –
 *  zostawi domyślne 3.6460, lub po loadRates() podmieni na świeży kurs)
 * ═════════════════════════════════════════════════════════════════════ */

// Globalny obiekt kursów – DOMYŚLNE wartości to aktualny kurs NBP
window.APP = window.APP || {};
window.APP.RATES = window.APP.RATES || {
  USD_to_PLN: 3.6460,   // NBP tabela 083/A/NBP/2026 z 2026-04-30
  EUR_to_PLN: 4.2589,   // NBP tabela 083/A/NBP/2026 z 2026-04-30
  USD_to_EUR: 0.8561,   // wyliczone z USD_PLN / EUR_PLN
  date: '2026-04-30',
  source: 'NBP tabela A'
};

// Pobiera świeży kurs z rates.json (generowany co tydzień przez bota,
// lub statyczny w repo). Jeśli nieosiągalny – zostają wartości domyślne.
async function loadDynamicRates() {
  try {
    const res = await fetch('rates.json?t=' + Date.now());
    if (!res.ok) {
      console.warn('⚠️ rates.json HTTP ' + res.status + ' – używam domyślnych');
      return;
    }
    const r = await res.json();

    // Walidacja: kurs musi być sensowny (USD/PLN powinien być w ~3-5 zł)
    if (r.usd_pln && r.usd_pln >= 2 && r.usd_pln <= 8) {
      window.APP.RATES.USD_to_PLN = r.usd_pln;
    }
    if (r.eur_pln && r.eur_pln >= 3 && r.eur_pln <= 8) {
      window.APP.RATES.EUR_to_PLN = r.eur_pln;
    }
    if (r.usd_eur && r.usd_eur > 0.5 && r.usd_eur < 1.5) {
      window.APP.RATES.USD_to_EUR = r.usd_eur;
    }
    if (r.date)   window.APP.RATES.date = r.date;
    if (r.source) window.APP.RATES.source = r.source;

    console.log('✅ Kurs NBP', window.APP.RATES.date,
                '· USD/PLN', window.APP.RATES.USD_to_PLN,
                '· EUR/PLN', window.APP.RATES.EUR_to_PLN);

    // Pokaż datę kursu w stopce (jeśli element istnieje)
    const el = document.getElementById('rate-info');
    if (el) {
      el.textContent = `Kurs NBP z ${window.APP.RATES.date} – ` +
                       `USD/PLN ${window.APP.RATES.USD_to_PLN.toFixed(4)}`;
    }
  } catch (e) {
    console.warn('⚠️ Nie udało się pobrać rates.json:', e.message);
  }
}

// Funkcje pomocnicze cenowe – zastępują hardcoded `4.20 * 1.05`
function pricePLN(usd) {
  if (!usd || usd <= 0) return '<em>Zapytaj o cenę</em>';
  return (usd * window.APP.RATES.USD_to_PLN).toFixed(2) + ' zł';
}
function priceUSD(usd) {
  if (!usd || usd <= 0) return '—';
  return '$' + Number(usd).toFixed(2);
}
function priceEUR(usd) {
  if (!usd || usd <= 0) return '—';
  return '€' + (usd * window.APP.RATES.USD_to_EUR).toFixed(2);
}

// Wywołaj od razu – ładowanie kursu jest async, ale strona ma fallback
loadDynamicRates();

/* ═════════════════════════════════════════════════════════════════════
 *  KONIEC PATCHA – poniżej zachowaj istniejący kod app.js
 * ═════════════════════════════════════════════════════════════════════ */
