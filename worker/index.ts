interface Env {
  ASSETS: {
    fetch: typeof fetch
  }
}

const TEXLIVE_TARGETS: Record<string, string> = {
  '2025': 'https://texlive.corca.ai/snapshots/2025-92e10d3241a312f0/2025',
  '2026': 'https://texlive.corca.ai/snapshots/2026-ba38749b8714505a/2026',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle OPTIONS preflight for /texlive/
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/texlive/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Proxy /texlive/<year>/... to upstream TeX Live R2 snapshot
    if (url.pathname.startsWith('/texlive/')) {
      const match = url.pathname.match(/^\/texlive\/(2025|2026)\/(.*)$/)
      if (match) {
        const year = match[1]!
        const rest = match[2]!
        const base = TEXLIVE_TARGETS[year]
        const targetUrl = `${base}/${rest}`

        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: {
            Origin: 'https://corca-ai.github.io',
            Referer: 'https://corca-ai.github.io/',
          },
        })

        const headers = new Headers(upstream.headers)
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers,
        })
      }
    }

    // Static assets
    const res = await env.ASSETS.fetch(request)
    const headers = new Headers(res.headers)
    headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    })
  },
}
