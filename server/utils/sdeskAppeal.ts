function maskTokenInUrl(url: string) {
  return url.replace(/([?&])token=[^&]+/g, '$1token=***')
}

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

function serializeErrorChain(e: unknown, includeStack: boolean): Record<string, unknown> {
  const chain: Array<Record<string, unknown>> = []
  let current: unknown = e
  let depth = 0

  while (current && depth < 6) {
    const err = current as {
      name?: string
      message?: string
      code?: string | number
      errno?: number
      syscall?: string
      hostname?: string
      cause?: unknown
      stack?: string
    }

    chain.push({
      name: err.name,
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname,
      ...(includeStack && err.stack ? { stack: err.stack } : {}),
    })

    current = err.cause
    depth++
  }

  return { chain, depth }
}

function parseUrlForLog(url: string) {
  try {
    const parsed = new URL(url)
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      pathname: parsed.pathname,
      searchKeys: [...parsed.searchParams.keys()],
      hasToken: parsed.searchParams.has('token'),
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    return { parseError: err.message ?? 'invalid url' }
  }
}

const SDESK_TOKEN = process.env.SDESK_TOKEN ?? 'qwertyuiop'
const SDESK_CREATE_APPEAL_URL =
  process.env.SDESK_CREATE_APPEAL_URL ??
  `https://sd64898.sdeskdev.kck.ru/integration-server/hooks/sdesk/create_appeal?token=${encodeURIComponent(SDESK_TOKEN)}`

const SDESK_DEBUG = process.env.SDESK_DEBUG === 'true'
const SDESK_TIMEOUT_MS = Number(process.env.SDESK_TIMEOUT_MS ?? 30_000)
const SDESK_LOG_BODY_MAX = 2000
const SDESK_PROBE_OUTBOUND = process.env.SDESK_PROBE_OUTBOUND !== 'false'
const SDESK_PROBE_URL = process.env.SDESK_PROBE_URL ?? 'https://ya.ru'

async function probeOutboundGet(requestId: string): Promise<void> {
  const startedAt = Date.now()

  console.info('[outbound-probe] start', {
    requestId,
    method: 'GET',
    url: SDESK_PROBE_URL,
    urlParts: parseUrlForLog(SDESK_PROBE_URL),
    startedAt: new Date(startedAt).toISOString(),
  })

  try {
    const res = await fetch(SDESK_PROBE_URL, { method: 'GET' })

    const durationMs = Date.now() - startedAt
    let responseBody = ''

    try {
      responseBody = await res.text()
    } catch {
      // ignore
    }

    const log = {
      requestId,
      durationMs,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url: SDESK_PROBE_URL,
      responseHeaders: headersToObject(res.headers),
      responseBodyLength: responseBody.length,
      responseBodySnippet: responseBody.slice(0, 500),
    }

    if (res.ok) {
      console.info('[outbound-probe] success', log)
    } else {
      console.warn('[outbound-probe] responded not ok', log)
    }
  } catch (e: unknown) {
    console.error('[outbound-probe] failed', {
      requestId,
      durationMs: Date.now() - startedAt,
      url: SDESK_PROBE_URL,
      urlParts: parseUrlForLog(SDESK_PROBE_URL),
      ...serializeErrorChain(e, SDESK_DEBUG),
    })
  }
}

export async function createSdeskAppeal(params: {
  category: string
  description: string | undefined
}): Promise<boolean> {
  const startedAt = Date.now()
  const requestId = globalThis.crypto?.randomUUID?.() ?? `sdesk-${startedAt}`
  const controller = new AbortController()
  const timeoutMs = Number.isFinite(SDESK_TIMEOUT_MS) && SDESK_TIMEOUT_MS > 0 ? SDESK_TIMEOUT_MS : 30_000
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let abortedByTimeout = false

  const requestBody = {
    category: params.category,
    description: params.description ?? '',
  }

  const requestLog = {
    requestId,
    phase: 'request',
    method: 'POST',
    url: maskTokenInUrl(SDESK_CREATE_APPEAL_URL),
    urlParts: parseUrlForLog(SDESK_CREATE_APPEAL_URL),
    headers: { 'content-type': 'application/json' },
    body: requestBody,
    bodyBytes: Buffer.byteLength(JSON.stringify(requestBody), 'utf8'),
    timeoutMs,
    nodeVersion: process.version,
    pid: process.pid,
    startedAt: new Date(startedAt).toISOString(),
  }

  console.info('[sdesk] create_appeal start', requestLog)

  const probePromise = SDESK_PROBE_OUTBOUND ? probeOutboundGet(requestId) : Promise.resolve()

  try {
    timeoutId = setTimeout(() => {
      abortedByTimeout = true
      controller.abort()
    }, timeoutMs)

    const res = await fetch(SDESK_CREATE_APPEAL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    const durationMs = Date.now() - startedAt
    let responseBody = ''

    try {
      responseBody = await res.text()
    } catch (readErr: unknown) {
      const err = readErr as { name?: string; message?: string }
      console.error('[sdesk] create_appeal response body read failed', {
        requestId,
        durationMs,
        name: err.name,
        message: err.message,
      })
    }

    const responseLog = {
      requestId,
      phase: 'response',
      durationMs,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url: maskTokenInUrl(SDESK_CREATE_APPEAL_URL),
      responseHeaders: headersToObject(res.headers),
      responseBodyLength: responseBody.length,
      responseBodySnippet: responseBody.slice(0, SDESK_LOG_BODY_MAX),
      redirected: res.redirected,
      responseType: res.type,
    }

    if (res.ok) {
      console.info('[sdesk] create_appeal success', responseLog)
    } else {
      console.error('[sdesk] create_appeal responded not ok', responseLog)
    }

    return res.ok
  } catch (e: unknown) {
    const durationMs = Date.now() - startedAt
    const err = e as { name?: string; message?: string }
    const timedOut = abortedByTimeout || err?.name === 'AbortError'

    console.error('[sdesk] create_appeal failed', {
      requestId,
      phase: 'error',
      durationMs,
      reason: timedOut ? 'timeout' : 'network_or_fetch_error',
      abortedByTimeout,
      signalAborted: controller.signal.aborted,
      timeoutMs: timedOut ? timeoutMs : undefined,
      url: maskTokenInUrl(SDESK_CREATE_APPEAL_URL),
      urlParts: parseUrlForLog(SDESK_CREATE_APPEAL_URL),
      request: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: requestBody,
      },
      ...serializeErrorChain(e, SDESK_DEBUG),
    })

    return false
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    await probePromise
  }
}
