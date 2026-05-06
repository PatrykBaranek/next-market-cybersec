// SECURITY (typical): hardcoded base URL prevents arbitrary host SSRF.
// User controls only the `currency` query param, which is interpolated into the URL string.
// Without explicit validation, exotic values could break the URL or hit unexpected paths.
// baseline diff: user controls full `?api_url=` (full SSRF).
// hardened diff: + currency allowlist, timeout, no credentials, User-Agent header.

const BASE_URL = 'https://api.exchangerate.host/latest';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') ?? 'EUR';

  const url = `${BASE_URL}?base=PLN&symbols=${currency}`;
  const res = await fetch(url);

  if (!res.ok) {
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ rate: data.rates?.[currency] ?? null, raw: data });
}
