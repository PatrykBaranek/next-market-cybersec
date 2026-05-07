// SECURITY (baseline): user controls full target URL via ?api_url= (T6 — full SSRF).
// Try: /api/exchange-rate?api_url=http://localhost:5432
// Try: /api/exchange-rate?api_url=http://169.254.169.254/latest/meta-data/  (cloud metadata)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiUrl = searchParams.get('api_url') ?? 'https://api.exchangerate.host/latest';

  const res = await fetch(apiUrl);
  const data = await res.text();

  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}
