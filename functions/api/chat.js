// Czat AI na dronepartshub.eu: szukanie części DJI Agras po modelu drona, nazwie lub numerze katalogowym.
// 1) Wyszukiwanie w parts.json (zawsze, bez AI) – numer katalogowy, model (T25P/T50/T100), słowa z nazwy i kategorii.
// 2) Jeśli jest ANTHROPIC_API_KEY – AI układa odpowiedź WYŁĄCZNIE z części znalezionych w katalogu
//    (gdy nic nie znaleziono, AI najpierw zamienia pytanie na słowa kluczowe i szukamy jeszcze raz).
//
// Zmienne w Cloudflare Pages: ANTHROPIC_API_KEY (sekret), opcjonalnie ANTHROPIC_MODEL.
// Rozmowy nie są zapisywane na serwerze.

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

const MODEL = 'claude-haiku-5-5';
const MODELS = ['T100', 'T25P', 'T50'];
const NAME = { pl: 'nazwa_pl', ua: 'nazwa_ua', en: 'nazwa_en' };
const CAT = { pl: 'kategoria_pl', ua: 'kategoria_ua', en: 'kategoria_en' };
const STOP = new Set(('do dla na od po przy pod nad za i oraz lub czy jest jak jaki jaka jakie mam macie szukam potrzebuje potrzebuję potrzebna ' +
  'potrzebny czesc część czesci części dron drona dji agras numer nr kod katalogowy fabryczny model modelu prosze proszę ' +
  'the for a an of to and or my need looking part parts drone number code please do you have ' +
  'для на до та або мені потрібно потрібна запчастина запчастини дрон номер код модель є').split(/\s+/));

// Proste synonimy (gdy klient pisze potocznie); klucz = pierwsze 5 liter słowa po normalizacji
const SYN = { bater: 'akumulator battery', akumu: 'battery', smigl: 'propeller', propeller: 'smiglo', pompa: 'pump', pompy: 'pump', dysza: 'nozzle',
  dysze: 'nozzle', silni: 'motor', ramie: 'arm', ramio: 'arm', ladow: 'charger', kabel: 'cable', kable: 'cable', zbior: 'tank', radar: 'radar',
  kamer: 'camera', pilot: 'remote controller', czujn: 'sensor', uszcz: 'seal', filtr: 'filter', przew: 'cable hose', wenty: 'fan', plyta: 'board',
  'акуму': 'battery akumulator', 'батар': 'battery akumulator', 'пропе': 'propeller', 'гвинт': 'propeller', 'насос': 'pump', 'форсу': 'nozzle',
  'двигу': 'motor', 'мотор': 'motor', 'рама': 'frame arm', 'зарядн': 'charger', 'кабел': 'cable', 'бак': 'tank', 'камер': 'camera', 'пульт': 'remote controller' };
const expand = words => words.flatMap(w => [w, ...String(SYN[w.slice(0, 5)] || SYN[w] || '').split(' ').filter(Boolean)]);

let CACHE = null, CACHE_AT = 0;
async function loadParts(request, env) {
  if (CACHE && Date.now() - CACHE_AT < 10 * 60 * 1000) return CACHE;
  const url = new URL('/parts.json', request.url);
  const r = env.ASSETS ? await env.ASSETS.fetch(url) : await fetch(url);
  const list = await r.json();
  CACHE = list.map(p => {
    const words = norm([p.nazwa_pl, p.nazwa_en, p.nazwa_ua, p.kategoria_pl, p.kategoria_en, p.kategoria_ua].join(' '));
    return { p, words, words5: words.split(' ').map(w => w.slice(0, 5)), cat: alnum(p.numer_katalogowy) };
  });
  CACHE_AT = Date.now();
  return CACHE;
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
  .replace(/[^\p{L}\p{N}.\-]+/gu, ' ').trim();
const alnum = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function detectModel(q) {
  const m = q.toLowerCase().match(/\bt\s?-?\s?(100|25\s?p|50|25|70\s?p|70|40|30|20\s?p|20|10)\b/);
  if (!m) return null;
  const v = 'T' + m[1].replace(/\s/g, '').toUpperCase();
  return v === 'T25' ? 'T25P' : v; // w katalogu T25 występuje jako T25P
}

function search(parts, query, wantModel) {
  const q = norm(query);
  const model = wantModel || detectModel(query);
  const tokens = q.split(' ').filter(Boolean);
  const codeTokens = tokens.map(alnum).filter(t => /\d{4,}/.test(t) || /^[a-z]{2}[a-z]{2}[a-z]{2}\d+/.test(t));
  const base = tokens.filter(t => t.length >= 3 && !STOP.has(t) && !/^t\d+p?$/.test(t) && !/^\d+p?$/.test(t) && !codeTokens.includes(alnum(t)));
  const words = expand(base);
  if (!base.length && !codeTokens.length) return { model, codes: codeTokens, words: [], results: [] };
  const scored = [];
  for (const it of parts) {
    let s = 0;
    for (const c of codeTokens) {
      if (it.cat === c) s += 100;
      else if (c.length >= 5 && it.cat.includes(c)) s += 60;
    }
    let hits = 0;
    for (const w of words) {
      const w5 = w.slice(0, 5);
      if (it.words.includes(w)) hits += 2;
      else if (w5.length >= 4 && it.words5.includes(w5)) hits += 1;
    }
    s += hits * 10;
    if (words.length && hits === 0 && !codeTokens.length) continue;
    if (codeTokens.length && s < 60 && !hits) continue;
    if (!s && !(model && !words.length && !codeTokens.length)) continue;
    if (model && it.p.model === model) s += 15;
    else if (model && !codeTokens.length) continue;
    if (it.p.stan_magazynowy > 0) s += 1;
    scored.push([s, it.p]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return { model, codes: codeTokens, words, results: scored.slice(0, 8).map(x => x[1]) };
}

const slim = (p, lang) => ({
  id: p.id, model: p.model, numer_katalogowy: p.numer_katalogowy,
  nazwa: p[NAME[lang]] || p.nazwa_en || p.nazwa_pl, kategoria: p[CAT[lang]] || p.kategoria_en,
  nazwa_pl: p.nazwa_pl, nazwa_en: p.nazwa_en, nazwa_ua: p.nazwa_ua,
  cena_usd: p.cena_usd, stan_magazynowy: p.stan_magazynowy, zdjecie_url: p.zdjecie_url,
});

async function claude(env, system, messages, maxTokens = 450) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!r.ok) throw new Error('AI ' + r.status);
  const j = await r.json();
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
}

const TXT = {
  pl: { found: n => `Pasujące części w katalogu (${n}):`, none: 'Nie znalazłem takiej części w katalogu. Podaj model drona (T25P, T50, T100) i numer katalogowy z naklejki lub opisz część innymi słowami – albo zostaw kontakt, sprawdzimy ręcznie.', model: m => `Model ${m} – podaj nazwę części lub numer katalogowy, a wyszukam dokładnie.` },
  ua: { found: n => `Відповідні запчастини в каталозі (${n}):`, none: 'Не знайшов такої запчастини в каталозі. Вкажіть модель дрона (T25P, T50, T100) і каталожний номер або опишіть деталь іншими словами – або залиште контакт, перевіримо вручну.', model: m => `Модель ${m} – вкажіть назву запчастини або каталожний номер.` },
  en: { found: n => `I found ${n} matching parts:`, none: 'I could not find that part in the catalogue. Give the drone model (T25P, T50, T100) and the part number from the label, or describe the part differently – or leave your contact and we will check manually.', model: m => `Model ${m} – tell me the part name or part number and I will search precisely.` },
};

export async function onRequestPost({ request, env }) {
  let b = {};
  try { b = await request.json(); } catch { return J({ error: 'zły format' }, 400); }
  const lang = ['pl', 'ua', 'en'].includes(b.lang) ? b.lang : 'pl';
  const msg = String(b.message || '').trim().slice(0, 500);
  if (!msg) return J({ error: 'pusta wiadomość' }, 400);
  const history = (Array.isArray(b.history) ? b.history : []).slice(-6)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 800) }));
  const ctxModel = MODELS.includes(b.model) ? b.model : null;

  const parts = await loadParts(request, env);
  let s = search(parts, msg, detectModel(msg) || ctxModel);
  const ai = !!env.ANTHROPIC_API_KEY;

  // Nic nie znaleziono → AI zamienia opis na słowa kluczowe (PL i EN) i szukamy ponownie
  if (ai && !s.results.length && msg.length > 3) {
    try {
      const kw = await claude(env, 'Zamieniasz pytanie klienta o część do drona rolniczego DJI Agras na krótkie słowa kluczowe do wyszukiwarki katalogu. ' +
        'Zwróć tylko jedną linię: 3–8 słów po polsku i po angielsku (np. "pompa pump wirnik impeller"), bez komentarza.', [{ role: 'user', content: msg }], 60);
      if (kw) s = search(parts, kw + ' ' + (s.model || ''), s.model);
    } catch (e) {}
  }

  const found = s.results.map(p => slim(p, lang));
  let reply;
  if (ai) {
    try {
      const system = `Jesteś doradcą sklepu DronePartsHub.eu (oryginalne części zamienne do dronów rolniczych DJI Agras T25P, T50, T100; sprzedawca: Agrodron Sp. z o.o., Łódź). ` +
        `Odpowiadasz krótko (maks. 4 zdania) w języku: ${lang === 'ua' ? 'ukraińskim' : lang === 'en' ? 'angielskim' : 'polskim'}. ` +
        `Zasady: mów WYŁĄCZNIE o częściach z listy KATALOG poniżej – nigdy nie wymyślaj części, numerów ani cen. Karty części z ceną i przyciskiem „do koszyka” wyświetlą się pod Twoją odpowiedzią, więc nie wypisuj ich wszystkich – wskaż najlepiej pasującą i powiedz, czym się różnią, jeśli to istotne. ` +
        `Jeśli lista jest pusta albo nic nie pasuje: poproś o model drona i numer katalogowy z naklejki/instrukcji albo zaproponuj formularz kontaktowy. ` +
        `Dostępność i termin dostawy potwierdzamy po złożeniu zamówienia. Nie doradzaj w sprawach prawnych ani lotniczych. Nie proś o dane osobowe.\n\n` +
        `KATALOG (wyniki wyszukiwania dla tego pytania): ${JSON.stringify(found.map(p => ({ model: p.model, nr: p.numer_katalogowy, nazwa: p.nazwa, kategoria: p.kategoria, cena_usd: p.cena_usd, na_stanie: p.stan_magazynowy })))}`;
      reply = await claude(env, system, [...history, { role: 'user', content: msg }]);
    } catch (e) { reply = ''; }
  }
  if (!reply) {
    const T = TXT[lang];
    reply = found.length ? T.found(found.length) : (s.model && !s.words.length && !s.codes.length ? T.model(s.model) : T.none);
  }
  return J({ reply, parts: found, model: s.model || ctxModel || null, ai });
}

export const onRequestGet = () => J({ error: 'tylko POST' }, 405);
