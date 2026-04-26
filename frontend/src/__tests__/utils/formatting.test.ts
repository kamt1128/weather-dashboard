/**
 * Tests for formatting utilities
 */

import { describe, it, expect } from 'vitest'
import {
  formatTemperature,
  formatHumidity,
  formatWind,
  formatDatetime,
  getWeatherIcon,
} from '@/utils/formatting'

describe('Formatting Utils', () => {
  it('should format temperature correctly', () => {
    expect(formatTemperature(22.5)).toBe('22.5°C')
    expect(formatTemperature(0)).toBe('0.0°C')
    expect(formatTemperature(-5.3)).toBe('-5.3°C')
  })

  it('should format humidity correctly', () => {
    expect(formatHumidity(65)).toBe('65%')
    expect(formatHumidity(0)).toBe('0%')
    expect(formatHumidity(100)).toBe('100%')
  })

  it('should format wind correctly', () => {
    expect(formatWind(12.3)).toBe('12.3 m/s')
    expect(formatWind(0)).toBe('0.0 m/s')
    expect(formatWind(25.7)).toBe('25.7 m/s')
  })

  it('should format datetime correctly', () => {
    const dateStr = '2026-04-24T14:30:00Z'
    const formatted = formatDatetime(dateStr)
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)
  })

  it('should return correct weather icon based on temperature', () => {
    expect(getWeatherIcon(30, 50)).toBe('☀️')
    expect(getWeatherIcon(20, 50)).toBe('🌤️')
    expect(getWeatherIcon(10, 50)).toBe('☁️')
    expect(getWeatherIcon(0, 80)).toBe('❄️')
    expect(getWeatherIcon(3, 75)).toBe('🌧️')
  })
})
