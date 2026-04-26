/**
 * Offline indicator component
 */

import { Alert, Spin } from 'antd'
import { useUIStore } from '@/store/uiStore'

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wsStatus } = useUIStore()

  if (isOnline && wsStatus !== 'connecting') {
    return null
  }

  if (!isOnline) {
    return (
      <Alert
        type="warning"
        message="Modo offline"
        description="Mostrando últimos datos en caché. Reconectaremos automáticamente."
        showIcon
        style={{ marginBottom: 16 }}
      />
    )
  }

  if (wsStatus === 'connecting') {
    return (
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Spin size="small" />
        <span>Reconectando WebSocket...</span>
      </div>
    )
  }

  return null
}
