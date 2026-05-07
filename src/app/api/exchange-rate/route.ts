// SECURITY (hardened): allowlist of currencies, hardcoded base, timeout, no credentials.
// T6 mitigation.

const ALLOWED_API = 'https://api.exchangerate.host/latest';
const ALLOWED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CHF', 'CZK', 'PLN']);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get('currency') ?? 'EUR').toUpperCase();

  if (!ALLOWED_CURRENCIES.has(currency)) {
    return Response.json({ error: 'Unsupported currency' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${ALLOWED_API}?base=PLN&symbols=${currency}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NextMarket/1.0' },
      // SECURITY (hardened): never forward credentials.
      cache: 'no-store',
    });
    if (!res.ok) {
      return Response.json({ error: 'Exchange rate unavailable' }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ rate: data.rates?.[currency] ?? null });
  } catch {
    return Response.json({ error: 'Exchange rate unavailable' }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
