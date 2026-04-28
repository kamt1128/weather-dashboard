/**
 * Weather history table with pagination and export
 */

import { useState } from 'react'
import { Table, Input, Button, Space, Tooltip } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { useWeatherList } from '@/hooks/useWeatherData'
import { exportCsvUrl } from '@/services/api'
import { formatDatetime, formatTemperature, formatHumidity, formatWind } from '@/utils/formatting'
import { WeatherData } from '@/types/weather'

export const WeatherTable: React.FC = () => {
  const [requestedPage, setRequestedPage] = useState(1)
  const [requestedPageSize, setRequestedPageSize] = useState(20)
  const [cityFilter, setCityFilter] = useState<string>('')

  const { data, total, page, pageSize, loading } = useWeatherList({
    page: requestedPage,
    page_size: requestedPageSize,
    city: cityFilter || undefined,
  })

  const columns: TableProps<WeatherData>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Ciudad',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Temperatura',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 120,
      render: (temp) => formatTemperature(temp),
    },
    {
      title: 'Humedad',
      dataIndex: 'humidity',
      key: 'humidity',
      width: 100,
      render: (humidity) => formatHumidity(humidity),
    },
    {
      title: 'Viento',
      dataIndex: 'wind_speed',
      key: 'wind_speed',
      width: 120,
      render: (wind) => formatWind(wind),
    },
    {
      title: 'Fecha/Hora',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => formatDatetime(timestamp),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Input
          placeholder="Filtrar por ciudad..."
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value)
            setRequestedPage(1)
          }}
          style={{ width: 250 }}
        />
        <Tooltip title={`Descargar CSV ${cityFilter ? `de ${cityFilter}` : 'de todas las ciudades'}`}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              const url = exportCsvUrl({
                city: cityFilter || undefined,
              })
              window.location.href = url
            }}
          >
            Exportar CSV
          </Button>
        </Tooltip>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setRequestedPage(p)
            setRequestedPageSize(ps)
          },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 800 }}
      />
    </div>
  )
}

export default WeatherTable
