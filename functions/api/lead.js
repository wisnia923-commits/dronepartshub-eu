// Zamówienia i zapytania ze strony dronepartshub.eu → Bitrix24 (+ zapas w KV).
// Wywoływane przez dph.js: koszyk, kasa, wynajem, hurt (B2B), formularz kontaktowy.
//
// Zmienne w Cloudflare Pages (Settings → Variables and Secrets):
//   BITRIX_WEBHOOK   – adres webhooka przychodzącego Bitrix24, np. https://firma.bitrix24.pl/rest/1/xxxx/  (sekret)
//   BITRIX_USER_ID   – opcjonalnie: ID opiekuna w Bitrix24 (komu przypisać zapytanie)
//   BITRIX_SOURCE    – opcjonalnie: SOURCE_ID w Bitrix24 (domyślnie WEB)
// Wiązanie KV (opcjonalnie): LEADS – kopia każdego zgłoszenia na 12 miesięcy (jak w polityce prywatności).

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

const KINDS = { order: 'Zamówienie', rental: 'Wynajem T50', b2b: 'Wniosek B2B', contact: 'Wiadomość', question: 'Pytanie o część' };
const str = (v, n = 300) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, n);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function toBitrix(env, rec, host) {
  if (!env.BITRIX_WEBHOOK) return 'nie skonfigurowano';
  const base = env.BITRIX_WEBHOOK.replace(/\/?$/, '/');
  const fields = {
    TITLE: '[DPH] ' + (KINDS[rec.kind] || 'Zapytanie') + ' – ' + (rec.company || rec.name || rec.phone || rec.email || 'bez nazwy'),
    NAME: rec.name,
    COMPANY_TITLE: rec.company,
    SOURCE_ID: env.BITRIX_SOURCE || 'WEB',
    SOURCE_DESCRIPTION: 'dronepartshub.eu – ' + (KINDS[rec.kind] || rec.kind) + (rec.page ? ' (' + rec.page + ')' : ''),
    COMMENTS: esc(rec.message).replace(/\n/g, '<br>') + (rec.nip ? '<br><br>NIP: ' + esc(rec.nip) : ''),
    OPENED: 'Y',
    UTM_SOURCE: rec.utm_source, UTM_MEDIUM: rec.utm_medium, UTM_CAMPAIGN: rec.utm_campaign,
  };
  if (rec.phone) fields.PHONE = [{ VALUE: rec.phone, VALUE_TYPE: 'WORK' }];
  if (rec.email) fields.EMAIL = [{ VALUE: rec.email, VALUE_TYPE: 'WORK' }];
  if (rec.total_pln > 0) { fields.OPPORTUNITY = rec.total_pln; fields.CURRENCY_ID = 'PLN'; }
  if (env.BITRIX_USER_ID) fields.ASSIGNED_BY_ID = env.BITRIX_USER_ID;
  try {
    const r = await fetch(base + 'crm.lead.add.json', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } }),
    });
    const j = await r.json().catch(() => ({}));
    return j.result ? 'lead ' + j.result : 'błąd: ' + (j.error_description || j.error || r.status);
  } catch (e) {
    return 'błąd: ' + e.message;
  }
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > 30000) return J({ ok: false, error: 'za duże' }, 413);
  let b = {};
  try { b = JSON.parse(raw || '{}'); } catch { return J({ ok: false, error: 'zły format' }, 400); }
  if (b.website) return J({ ok: true }); // pułapka na boty – pole ukryte dla ludzi

  const rec = {
    ts: new Date().toISOString(),
    kind: KINDS[b.kind] ? b.kind : 'contact',
    name: str(b.name, 120), company: str(b.company, 160), nip: str(b.nip, 20),
    phone: str(b.phone, 40), email: str(b.email, 160),
    message: str(b.message, 12000),
    total_pln: Math.max(0, Number(b.total_pln) || 0),
    page: str(b.page, 200), lang: str(b.lang, 5),
    utm_source: str(b.utm_source, 80), utm_medium: str(b.utm_medium, 80), utm_campaign: str(b.utm_campaign, 120),
  };
  if (!rec.phone && !rec.email) return J({ ok: false, error: 'brak telefonu i e-maila' }, 400);
  if (rec.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rec.email)) return J({ ok: false, error: 'zły e-mail' }, 400);

  const host = new URL(request.url).hostname;
  rec.bitrix = await toBitrix(env, rec, host);

  let saved = false;
  if (env.LEADS) {
    try {
      await env.LEADS.put('dph:' + rec.ts + ':' + crypto.randomUUID().slice(0, 8), JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
      saved = true;
    } catch (e) {}
  }
  const sent = /^lead /.test(rec.bitrix);
  if (!sent && !saved) return J({ ok: false, error: 'Bitrix: ' + rec.bitrix }, 503);
  return J({ ok: true, id: sent ? rec.bitrix.slice(5) : null });
}

export const onRequestGet = () => J({ ok: false, error: 'tylko POST' }, 405);
