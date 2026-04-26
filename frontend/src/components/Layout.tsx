/**
 * Layout component with header, footer, and responsive structure
 */

import { Layout, Tag, Button, Space } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useUIStore } from '@/store/uiStore'

interface LayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { wsStatus, setPrintMode } = useUIStore()

  const statusColor = wsStatus === 'online' ? 'green' : wsStatus === 'connecting' ? 'orange' : 'red'
  const statusText =
    wsStatus === 'online' ? 'Conectado' : wsStatus === 'connecting' ? 'Conectando' : 'Desconectado'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#001529',
          paddingInline: 24,
        }}
      >
        <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 600 }}>
          Weather Real-Time Dashboard
        </h1>
        <Space>
          <Tag color={statusColor}>{statusText}</Tag>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              setPrintMode(true)
              window.print()
              setPrintMode(false)
            }}
          >
            Imprimir
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: '24px' }}>{children}</Layout.Content>
      <Layout.Footer style={{ textAlign: 'center' }}>
        Enersinc – Prueba Técnica © 2026
      </Layout.Footer>
    </Layout>
  )
}

export default AppLayout
