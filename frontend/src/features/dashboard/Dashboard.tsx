/**
 * Dashboard feature component
 */

import { Row, Col, Card, Input, Button, List, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useWeatherStore } from '@/store/weatherStore'
import { useDashboard } from '@/hooks/useWeatherData'
import { useWebSocket } from '@/hooks/useWebSocket'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CityCard } from './CityCard'
import { TimeSeriesChart } from './TimeSeriesChart'
import { formatTimestamp } from '@/utils/formatting'

const POPULAR_CITIES = ['Bogotá', 'Madrid', 'Nueva York', 'Londres', 'Tokio', 'Barcelona']

export const Dashboard: React.FC = () => {
  useWebSocket()

  const [city1Search, setCity1Search] = useState('')
  const [city2Search, setCity2Search] = useState('')
  const [showCity1Suggestions, setShowCity1Suggestions] = useState(false)
  const [showCity2Suggestions, setShowCity2Suggestions] = useState(false)

  const { city1, city2, setCity1, setCity2, liveUpdates } = useWeatherStore()
  const { data, loading, error } = useDashboard(city1, city2)

  const getNextCities = () => ({
    nextCity1: city1Search.trim() || city1,
    nextCity2: city2Search.trim() || city2,
  })

  const handleCompare = () => {
    const { nextCity1, nextCity2 } = getNextCities()

    setCity1(nextCity1)
    setCity2(nextCity2)
    setCity1Search('')
    setCity2Search('')
    setShowCity1Suggestions(false)
    setShowCity2Suggestions(false)
  }

  const handleSelectCity1 = (c: string) => {
    setCity1(c)
    setCity1Search('')
    setShowCity1Suggestions(false)
  }

  const handleSelectCity2 = (c: string) => {
    setCity2(c)
    setCity2Search('')
    setShowCity2Suggestions(false)
  }

  const filteredSuggestions1 = city1Search
    ? POPULAR_CITIES.filter((c) =>
        c.toLowerCase().includes(city1Search.toLowerCase())
      )
    : POPULAR_CITIES

  const filteredSuggestions2 = city2Search
    ? POPULAR_CITIES.filter((c) =>
        c.toLowerCase().includes(city2Search.toLowerCase())
      )
    : POPULAR_CITIES

  const { nextCity1, nextCity2 } = getNextCities()
  const compareDisabled =
    !nextCity1 ||
    !nextCity2 ||
    (nextCity1.toLowerCase() === city1.toLowerCase() &&
      nextCity2.toLowerCase() === city2.toLowerCase())

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <Card type="inner" style={{ marginBottom: 16, background: '#fff2f0', borderColor: '#ffccc7' }}>
          <div style={{ color: '#cf1322' }}>Error: {error}</div>
        </Card>
      )}

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={11}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>Ciudad 1</label>
              <Input
                placeholder={city1}
                value={city1Search}
                onChange={(e) => {
                  setCity1Search(e.target.value)
                  setShowCity1Suggestions(true)
                }}
                onPressEnter={handleCompare}
                onFocus={() => setShowCity1Suggestions(true)}
                prefix={<SearchOutlined />}
              />
              {showCity1Suggestions && city1Search && (
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderTop: 'none',
                    padding: 8,
                    maxHeight: 150,
                    overflowY: 'auto',
                    background: '#fafafa',
                  }}
                >
                  {filteredSuggestions1.map((c) => (
                    <div
                      key={c}
                      onClick={() => handleSelectCity1(c)}
                      style={{
                        padding: '8px 4px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#e6f7ff')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} sm={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="primary" block onClick={handleCompare} disabled={compareDisabled}>
              Comparar
            </Button>
          </Col>
          <Col xs={24} sm={11}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>Ciudad 2</label>
              <Input
                placeholder={city2}
                value={city2Search}
                onChange={(e) => {
                  setCity2Search(e.target.value)
                  setShowCity2Suggestions(true)
                }}
                onPressEnter={handleCompare}
                onFocus={() => setShowCity2Suggestions(true)}
                prefix={<SearchOutlined />}
              />
              {showCity2Suggestions && city2Search && (
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderTop: 'none',
                    padding: 8,
                    maxHeight: 150,
                    overflowY: 'auto',
                    background: '#fafafa',
                  }}
                >
                  {filteredSuggestions2.map((c) => (
                    <div
                      key={c}
                      onClick={() => handleSelectCity2(c)}
                      style={{
                        padding: '8px 4px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#e6f7ff')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <LoadingSpinner loading={loading} text="Cargando datos del dashboard...">
        {data && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12}>
                <CityCard city={city1} data={data.city1.latest} />
              </Col>
              <Col xs={24} sm={12}>
                <CityCard city={city2} data={data.city2.latest} />
              </Col>
            </Row>

            <Card title="Comparación visual" style={{ marginBottom: 24 }}>
              <TimeSeriesChart
                city1={city1}
                city2={city2}
                data1={data.city1.history}
                data2={data.city2.history}
              />
            </Card>

            <Card title={`Últimas actualizaciones en vivo (${liveUpdates.length})`}>
              {liveUpdates.length === 0 ? (
                <Empty description="Sin actualizaciones en vivo" />
              ) : (
                <List
                  dataSource={liveUpdates}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${item.city} - ${item.temperature}°C`}
                        description={`${formatTimestamp(item.timestamp)} | Humedad: ${item.humidity}% | Viento: ${item.wind_speed} m/s`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </>
        )}
      </LoadingSpinner>
    </div>
  )
}

export default Dashboard
