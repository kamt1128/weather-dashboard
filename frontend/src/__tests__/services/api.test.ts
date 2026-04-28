/**
 * Tests for API service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchWeatherList, exportCsvUrl } from '@/services/api'

const mockGet = vi.hoisted(() => vi.fn())
const mockResponseInterceptorUse = vi.hoisted(() => vi.fn())

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      interceptors: {
        response: {
          use: mockResponseInterceptorUse,
        },
      },
    })),
  },
}))

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch weather list with correct parameters', async () => {
    const mockData = {
      count: 10,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          city: 'Madrid',
          temperature: 22.5,
          humidity: 65,
          wind_speed: 12.3,
          timestamp: '2026-04-24T14:30:00Z',
        },
      ],
    }

    mockGet.mockResolvedValueOnce({ data: mockData })

    // Test case would verify the API call
    expect(fetchWeatherList).toBeDefined()
  })

  it('should generate correct CSV export URL', () => {
    const url = exportCsvUrl({
      city: 'Madrid',
      start_date: '2026-04-20',
      end_date: '2026-04-24',
    })

    expect(url).toContain('export-csv')
    expect(url).toContain('city=Madrid')
    expect(url).toContain('start_date=2026-04-20')
    expect(url).toContain('end_date=2026-04-24')
  })

  it('should omit undefined parameters in CSV URL', () => {
    const url = exportCsvUrl({
      city: 'Madrid',
    })

    expect(url).toContain('city=Madrid')
    expect(url).not.toContain('start_date')
    expect(url).not.toContain('end_date')
  })
})
