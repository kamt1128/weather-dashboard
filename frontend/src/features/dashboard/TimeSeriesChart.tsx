/**
 * Time series chart for weather data comparison
 */

import { useState } from 'react'
import { Radio } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { WeatherData } from '@/types/weather'
import dayjs from 'dayjs'

interface TimeSeriesChartProps {
  city1: string
  city2: string
  data1: WeatherData[]
  data2: WeatherData[]
}

type MetricType = 'temperature' | 'humidity' | 'wind_speed'

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  city1,
  city2,
  data1,
  data2,
}) => {
  const [metric, setMetric] = useState<MetricType>('temperature')

  // Merge and sort data
  const allData = [...data1, ...data2]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((item) => ({
      timestamp: dayjs(item.timestamp).format('HH:mm'),
      [city1]: item.city === city1 ? item[metric] : undefined,
      [city2]: item.city === city2 ? item[metric] : undefined,
    }))

  // Remove duplicates by timestamp
  const uniqueData = allData.reduce(
    (acc, curr) => {
      const existing = acc.find((item) => item.timestamp === curr.timestamp)
      if (existing) {
        return acc.map((item) =>
          item.timestamp === curr.timestamp
            ? {
                ...item,
                [city1]: item[city1] ?? curr[city1],
                [city2]: item[city2] ?? curr[city2],
              }
            : item
        )
      }
      return [...acc, curr]
    },
    [] as any[]
  )

  const metricLabel = {
    temperature: 'Temperatura (°C)',
    humidity: 'Humedad (%)',
    wind_speed: 'Viento (m/s)',
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={metric} onChange={(e) => setMetric(e.target.value)}>
          <Radio.Button value="temperature">Temperatura</Radio.Button>
          <Radio.Button value="humidity">Humedad</Radio.Button>
          <Radio.Button value="wind_speed">Viento</Radio.Button>
        </Radio.Group>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={uniqueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis label={{ value: metricLabel[metric], angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={city1}
            stroke="#8884d8"
            connectNulls
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={city2}
            stroke="#82ca9d"
            connectNulls
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
