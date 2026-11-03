interface R2ObjectBody {
  body: ReadableStream
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json<T>(): Promise<T>
}

interface R2Object {
  key: string
  size: number
  uploaded: Date
}

interface R2Objects {
  objects: R2Object[]
  truncated: boolean
  cursor?: string
}

interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string | null,
    options?: Record<string, unknown>,
  ): Promise<R2Object | null>
  get(key: string): Promise<R2ObjectBody | null>
  delete(key: string | string[]): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>
}

interface Env {
  ASSETS: {
    fetch: typeof fetch
  }
  DOCUMENTS_BUCKET?: R2Bucket
  MY_BUCKET?: R2Bucket
  STORAGE_PREFIX?: R2Bucket | string
  wasmtex?: R2Bucket
}

const TEXLIVE_TARGETS: Record<string, string> = {
  '2025': 'https://texlive.corca.ai/snapshots/2025-92e10d3241a312f0/2025',
  '2026': 'https://texlive.corca.ai/snapshots/2026-ba38749b8714505a/2026',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Resolve R2 bucket from available bindings (STORAGE_PREFIX, MY_BUCKET, DOCUMENTS_BUCKET, or wasmtex)
    const bucket =
      (env.STORAGE_PREFIX && typeof env.STORAGE_PREFIX === 'object' && 'put' in env.STORAGE_PREFIX
        ? (env.STORAGE_PREFIX as R2Bucket)
        : null) ||
      env.MY_BUCKET ||
      env.DOCUMENTS_BUCKET ||
      env.wasmtex

    const prefix = typeof env.STORAGE_PREFIX === 'string' ? env.STORAGE_PREFIX : ''

    // Handle OPTIONS preflight for all endpoints
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Direct PUT to R2 (e.g. PUT /<key>, /api/storage/<key>, /storage/<key>)
    if (request.method === 'PUT' && !url.pathname.startsWith('/texlive/')) {
      if (!bucket) {
        return new Response(
          JSON.stringify({
            status: 'unconfigured',
            message:
              'Cloudflare R2 bucket is not configured. Add STORAGE_PREFIX or MY_BUCKET in wrangler.jsonc to enable private cloud storage.',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      }

      const key = url.pathname.replace(/^\/(api\/storage|storage)\/?/, '').replace(/^\//, '')
      if (!key) {
        return new Response('Key required for PUT', {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      }

      const storageKey = prefix ? `${prefix}${key}` : key
      await bucket.put(storageKey, request.body)
      return new Response(`Put ${key} successfully!`, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // R2 Document Storage Endpoint (/api/storage/<key> or /storage/<key>) for GET & DELETE
    if (url.pathname.startsWith('/api/storage') || url.pathname.startsWith('/storage')) {
      const key = url.pathname.replace(/^\/(api\/storage|storage)\/?/, '')

      if (!bucket) {
        return new Response(
          JSON.stringify({
            status: 'unconfigured',
            message:
              'Cloudflare R2 bucket is not configured. Add STORAGE_PREFIX or MY_BUCKET in wrangler.jsonc to enable private cloud storage.',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      }

      const storageKey = prefix ? `${prefix}${key}` : key

      switch (request.method) {
        case 'GET': {
          if (!key) {
            // List files in bucket
            const list = await bucket.list({ prefix })
            return new Response(JSON.stringify(list), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            })
          }
          const obj = await bucket.get(storageKey)
          if (!obj) {
            return new Response('Not Found', {
              status: 404,
              headers: { 'Access-Control-Allow-Origin': '*' },
            })
          }
          return new Response(obj.body, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
        case 'DELETE': {
          if (!key) {
            return new Response('Key required for DELETE', {
              status: 400,
              headers: { 'Access-Control-Allow-Origin': '*' },
            })
          }
          await bucket.delete(storageKey)
          return new Response(`Deleted ${key} successfully!`, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
          })
        }
        default:
          return new Response(`${request.method} is not allowed.`, {
            status: 405,
            headers: {
              Allow: 'GET, PUT, DELETE',
              'Access-Control-Allow-Origin': '*',
            },
          })
      }
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
