export type AppAlertType = 'success' | 'error' | 'info'

export type AppAlert = {
  id: string
  type: AppAlertType
  message: string
}

const ALERTS_STATE_KEY = 'app-alerts'

export function useAppAlerts() {
  const alerts = useState<AppAlert[]>(ALERTS_STATE_KEY, () => [])

  function dismiss(id: string) {
    alerts.value = alerts.value.filter((a) => a.id !== id)
  }

  function pushAlert(params: { type: AppAlertType; message: string; durationMs?: number }) {
    const durationMs = params.durationMs ?? 3500
    const id = `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`

    alerts.value = [...alerts.value, { id, type: params.type, message: params.message }]

    if (typeof window !== 'undefined') {
      window.setTimeout(() => dismiss(id), durationMs)
    }
  }

  return { alerts, pushAlert, dismiss }
}

