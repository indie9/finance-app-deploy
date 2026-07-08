function maskTokenInUrl(url: string) {
  // Нельзя светить токен в логах.
  return url.replace(/([?&])token=[^&]+/g, '$1token=***')
}

const SDESK_TOKEN = process.env.SDESK_TOKEN ?? 'qwertyuiop'
const SDESK_CREATE_APPEAL_URL =
  process.env.SDESK_CREATE_APPEAL_URL ??
  `https://sd64898.sdeskdev.kck.ru/integration-server/hooks/sdesk/create_appeal?token=${encodeURIComponent(SDESK_TOKEN)}`

const SDESK_DEBUG = process.env.SDESK_DEBUG === 'true'

export async function createSdeskAppeal(params: {
  category: string
  description: string | undefined
}): Promise<boolean> {
  const controller = new AbortController()
  const timeoutMs = 8000
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(SDESK_CREATE_APPEAL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: params.category,
        description: params.description ?? '',
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      let bodySnippet: string | undefined
      if (SDESK_DEBUG) {
        try {
          bodySnippet = (await res.text()).slice(0, 500)
        } catch {
          // ignore
        }
      }
      console.error('[sdesk] create_appeal responded not ok', {
        status: res.status,
        statusText: res.statusText,
        url: maskTokenInUrl(SDESK_CREATE_APPEAL_URL),
        bodySnippet: bodySnippet ?? undefined,
      })
    }

    return res.ok
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string }
    console.error('[sdesk] create_appeal failed', {
      name: err?.name,
      message: err?.message,
      url: maskTokenInUrl(SDESK_CREATE_APPEAL_URL),
    })
    return false
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

