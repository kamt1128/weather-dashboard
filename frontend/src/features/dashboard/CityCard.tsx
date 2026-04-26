/**
 * City weather card component
 */

import { Card, Row, Col, Statistic } from 'antd'
import {
  CloudOutlined,
  DropletOutlined,
  WindOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { WeatherData } from '@/types/weather'
import {
  formatTemperature,
  formatHumidity,
  formatWind,
  formatTimestamp,
  getWeatherIcon,
} from '@/utils/formatting'

interface CityCardProps {
  city: string
  data: WeatherData
  highlight?: boolean
}

export const CityCard: React.FC<CityCardProps> = ({ city, data, highlight }) => {
  const icon = getWeatherIcon(data.temperature, data.humidity)

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <span>{city}</span>
        </div>
      }
      style={{
        boxShadow: highlight ? '0 4px 12px rgba(0, 150, 255, 0.3)' : undefined,
        transition: 'all 0.3s ease',
        animation: highlight ? 'highlight 0.5s ease' : undefined,
      }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Statistic
            title="Temperatura"
            value={data.temperature}
            suffix="°C"
            prefix={<CloudOutlined />}
            valueStyle={{ fontSize: 28, fontWeight: 600 }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Humedad"
            value={data.humidity}
            suffix="%"
            prefix={<DropletOutlined />}
            valueStyle={{ fontSize: 28, fontWeight: 600 }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Viento"
            value={data.wind_speed}
            suffix="m/s"
            prefix={<WindOutlined />}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined />
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Última actualización</div>
              <div style={{ fontSize: 14 }}>{formatTimestamp(data.timestamp)}</div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}
