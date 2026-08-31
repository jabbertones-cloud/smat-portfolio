/**
 * SMAT Designs Hub edge bridge.
 *
 * The public Hub origin is smatdesigns.com.  Requests are forwarded without
 * changing their body or Stripe signature, so the established checkout,
 * attribution, conversion, email, and inventory flows remain replay-safe
 * during runtime migration.
 */
const HUB_ORIGIN = 'https://commerce-os.smatdesigns.com';

function isHubRequest(pathname) {
  return pathname === '/hub' || pathname.startsWith('/hub/')
    || pathname === '/webhooks/stripe'
    || pathname === '/api/stripe/webhook'
    || pathname === '/api/intelligence/hub-funnel'
    || pathname === '/api/intelligence/hub-conversions';
}

function upstreamRequest(request) {
  const incoming = new URL(request.url);
  const upstreamPath = incoming.pathname === '/api/stripe/webhook'
    ? '/webhooks/stripe'
    : incoming.pathname;
  const upstream = new URL(upstreamPath + incoming.search, HUB_ORIGIN);
  const headers = new Headers(request.headers);
  headers.set('host', upstream.host);
  headers.set('x-forwarded-host', incoming.host);
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));
  return new Request(upstream, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!isHubRequest(url.pathname)) return env.ASSETS.fetch(request);

    const response = await fetch(upstreamRequest(request));
    const headers = new Headers(response.headers);
    headers.set('x-hub-origin', 'smatdesigns-pages');
    const location = headers.get('location');
    if (location) {
      headers.set('location', location
        .replaceAll('https://commerce-os.smatdesigns.com', 'https://smatdesigns.com')
        .replaceAll('https://commerce-os.smatdesigns.workers.dev', 'https://smatdesigns.com'));
    }
    const contentType = headers.get('content-type') || '';
    if (request.method !== 'HEAD' && (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('javascript'))) {
      const body = (await response.text())
        .replaceAll('https://commerce-os.smatdesigns.com', 'https://smatdesigns.com')
        .replaceAll('https://commerce-os.smatdesigns.workers.dev', 'https://smatdesigns.com');
      headers.delete('content-length');
      return new Response(body, { status: response.status, statusText: response.statusText, headers });
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
