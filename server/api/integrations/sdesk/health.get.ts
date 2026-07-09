import { assertSdeskInboundAuth } from '~/server/utils/sdeskInboundAuth'

export default defineEventHandler((event) => {
  assertSdeskInboundAuth(event)

  return {
    ok: true,
    service: 'finance-ai-nuxt',
    integration: 'sdesk',
    timestamp: new Date().toISOString(),
  }
})
