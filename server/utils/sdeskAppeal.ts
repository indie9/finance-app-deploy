const SDESK_TOKEN = 'qwertyuiop'
const SDESK_CREATE_APPEAL_URL = `https://sd64898.sdeskdev.kck.ru/integration-server/hooks/sdesk/create_appeal?token=${SDESK_TOKEN}`

export async function createSdeskAppeal(params: {
  category: string
  description: string | undefined
}): Promise<boolean> {
  try {
    const res = await fetch(SDESK_CREATE_APPEAL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: params.category,
        description: params.description ?? '',
      }),
    })

    return res.ok
  } catch {
    return false
  }
}

