import { useState } from 'react'
import { Tabs, ConfigProvider } from 'antd'
import es_ES from 'antd/locale/es_ES'
import './styles/App.css'
import { AppLayout } from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import Dashboard from '@/features/dashboard/Dashboard'
import WeatherTable from '@/features/weather-table/WeatherTable'
import { useOffline } from '@/hooks/useOffline'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Initialize offline listener
  useOffline()

  const items = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: <Dashboard />,
    },
    {
      key: 'historico',
      label: 'Histórico',
      children: <WeatherTable />,
    },
  ]

  return (
    <ConfigProvider locale={es_ES}>
      <ErrorBoundary>
        <AppLayout>
          <OfflineIndicator />
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        </AppLayout>
      </ErrorBoundary>
    </ConfigProvider>
  )
}

export default App
