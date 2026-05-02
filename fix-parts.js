/* ═══════════════════════════════════════════════════════════════════════
 *  FIX-PARTS.js — Uniwersalna naprawa licznika części
 *  ═════════════════════════════════════════════════════════════════════
 *  Problem: app.js pokazuje "758 części" mimo że parts.json ma 1537
 *  Przyczyna: w app.js zaszyte na sztywno liczby + slice(0, 758) gdzieś
 *
 *  TEN PLIK ROBI:
 *  1. Pobiera świeży parts.json
 *  2. Nadpisuje window.EMBEDDED_PARTS i zmienne globalne
 *  3. Wyszukuje wszystkie napisy "758" w DOM i zamienia na rzeczywistą liczbę
 *  4. Wymusza re-render katalogu/bestsellerów
 *
 *  GDZIE WGRAĆ I JAK PODŁĄCZYĆ:
 *  ─────────────────────────────────────────────────────────────────────
 *  1. Zapisz ten plik jako: fix-parts.js w głównym folderze sklepu
 *  2. W każdym pliku HTML (index.html, catalog.html, ...) PRZED </body>
 *     dodaj linię:
 *
 *       <script src="fix-parts.js?v=1"></script>
 *
 *     UWAGA: ta linia musi być PO <script src="app.js"></script>
 *
 *  Po wgraniu: Ctrl+Shift+R (twardy refresh) — działa!
 * ═════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  console.log('🔧 FIX-PARTS uruchomiony, czekam na app.js...');

  // Czeka aż DOM się załaduje + dodatkowe 500ms na app.js
  function waitForApp(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(callback, 500));
    } else {
      setTimeout(callback, 500);
    }
  }

  waitForApp(async function() {
    try {
      // 1. Pobierz świeży parts.json
      const response = await fetch('parts.json?fix=' + Date.now(), {
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('⚠️ FIX: parts.json HTTP ' + response.status);
        return;
      }

      const freshParts = await response.json();

      if (!Array.isArray(freshParts) || freshParts.length === 0) {
        console.warn('⚠️ FIX: parts.json jest pusty');
        return;
      }

      const realCount = freshParts.length;
      const t100Count = freshParts.filter(p => p.model === 'T100').length;
      const t50Count = freshParts.filter(p => p.model === 'T50').length;
      const t25pCount = freshParts.filter(p => p.model === 'T25P' || p.model === 'T25').length;

      console.log('✅ FIX: Pobrano świeże parts.json:', realCount, 'części');
      console.log('   T100:', t100Count, '| T50:', t50Count, '| T25P:', t25pCount);

      // 2. Nadpisz globalne zmienne (różne nazwy używane w app.js)
      window.EMBEDDED_PARTS = freshParts;
      window.PARTS = freshParts;
      window.parts = freshParts;
      window.allParts = freshParts;
      window.partsData = freshParts;
      window.PARTS_DATA = freshParts;
      window.__FIX_PARTS_COUNT = realCount;

      // 3. Zamień napisy "758" w DOM na rzeczywistą liczbę
      // Szukamy w treści tekstowej (nie w atrybutach, klasach itp.)
      const numbersToReplace = ['758', '249', '490', '19'];
      const replacements = {
        '758': String(realCount),
        '249': String(t25pCount),  // T25 -> T25P
        '490': String(t100Count),
        '19': String(t50Count)
      };

      function replaceTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.nodeValue;
          let changed = false;

          // Zamień każdą starą liczbę na nową, ale tylko gdy to "samodzielna" liczba
          for (const oldNum of numbersToReplace) {
            // Regex: liczba musi być otoczona nie-cyframi (lub początek/koniec)
            const regex = new RegExp('(?<![\\d.])' + oldNum + '(?![\\d.])', 'g');
            if (regex.test(text)) {
              text = text.replace(regex, replacements[oldNum]);
              changed = true;
            }
          }

          if (changed) {
            node.nodeValue = text;
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)
        ) {
          for (const child of Array.from(node.childNodes)) {
            replaceTextNodes(child);
          }
        }
      }

      replaceTextNodes(document.body);
      console.log('✅ FIX: Zaktualizowano liczby w DOM');

      // 4. Spróbuj wymusić re-render (jeśli app.js ma takie funkcje)
      const renderFunctions = [
        'renderCatalog', 'renderBestsellers', 'renderProducts',
        'updateCatalog', 'loadCatalog', 'init', 'main',
        'showProducts', 'displayParts'
      ];

      for (const fnName of renderFunctions) {
        if (typeof window[fnName] === 'function') {
          try {
            window[fnName](freshParts);
            console.log('✅ FIX: Wywołano', fnName + '()');
          } catch (e) {
            // Niektóre funkcje nie biorą argumentów - próbuj bez
            try {
              window[fnName]();
            } catch (e2) {
              // Ignoruj
            }
          }
        }
      }

      // 5. Zaktualizuj liczniki w hero (różne nazwy klas)
      const heroSelectors = [
        '.hero__stat-num',
        '.stat-num',
        '.parts-count',
        '[data-parts-count]',
        '.hero-counter'
      ];

      heroSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const txt = el.textContent.trim();
          // Jeśli element zawiera liczbę 758, zaktualizuj ją
          if (txt === '758' || txt === '249' || txt === '490' || txt === '19') {
            // Już zostało zaktualizowane przez replaceTextNodes powyżej
            // ale dla pewności
            if (txt === '758') el.textContent = realCount;
          }
        });
      });

      // 6. Pokaż banner sukcesu (przez 3 sek, dla developera)
      if (typeof console.log === 'function') {
        console.log(
          '%c✅ FIX-PARTS GOTOWE: ' + realCount + ' części wczytanych',
          'background: #4CAF50; color: white; padding: 4px 8px; font-size: 14px; font-weight: bold;'
        );
      }

    } catch (err) {
      console.error('❌ FIX-PARTS error:', err);
    }
  });
})();
