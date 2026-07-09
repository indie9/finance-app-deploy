import { timingSafeEqual } from 'node:crypto'

const SDESK_INBOUND_TOKEN = process.env.SDESK_INBOUND_TOKEN ?? process.env.SDESK_TOKEN ?? 'qwertyuiop'

function safeEqualToken(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

function readTokenFromQuery(event: Parameters<typeof getQuery>[0]): string {
  const query = getQuery(event)
  const token = query.token
  return typeof token === 'string' ? token.trim() : ''
}

function readTokenFromHeader(event: Parameters<typeof getHeader>[0]): string {
  const auth = getHeader(event, 'authorization')
  if (!auth) return ''

  const bearer = auth.match(/^Bearer\s+(.+)$/i)
  if (bearer?.[1]) return bearer[1].trim()

  return auth.trim()
}

export function assertSdeskInboundAuth(event: Parameters<typeof getQuery>[0]): void {
  const provided = readTokenFromQuery(event) || readTokenFromHeader(event)

  if (!provided || !safeEqualToken(provided, SDESK_INBOUND_TOKEN)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or missing integration token.' })
  }
}
