/**
 * Tests for Zustand weather store
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useWeatherStore } from '@/store/weatherStore'

describe('Weather Store', () => {
  beforeEach(() => {
    // Reset store between tests
    useWeatherStore.setState({
      city1: 'Bogotá',
      city2: 'Madrid',
      dashboard: null,
      liveUpdates: [],
      loading: false,
      error: null,
    })
  })

  it('should initialize with default cities', () => {
    const state = useWeatherStore.getState()
    expect(state.city1).toBe('Bogotá')
    expect(state.city2).toBe('Madrid')
  })

  it('should set city1', () => {
    useWeatherStore.getState().setCity1('Nueva York')
    const state = useWeatherStore.getState()
    expect(state.city1).toBe('Nueva York')
  })

  it('should set city2', () => {
    useWeatherStore.getState().setCity2('Londres')
    const state = useWeatherStore.getState()
    expect(state.city2).toBe('Londres')
  })

  it('should add live update and maintain limit of 50', () => {
    const state = useWeatherStore.getState()

    // Add 60 updates
    for (let i = 0; i < 60; i++) {
      state.pushLiveUpdate({
        id: i,
        city: 'Madrid',
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        wind_speed: Math.random() * 20,
        timestamp: new Date().toISOString(),
      })
    }

    const finalState = useWeatherStore.getState()
    expect(finalState.liveUpdates.length).toBe(50)
  })

  it('should set loading state', () => {
    useWeatherStore.getState().setLoading(true)
    expect(useWeatherStore.getState().loading).toBe(true)

    useWeatherStore.getState().setLoading(false)
    expect(useWeatherStore.getState().loading).toBe(false)
  })

  it('should set error state', () => {
    useWeatherStore.getState().setError('Test error')
    expect(useWeatherStore.getState().error).toBe('Test error')

    useWeatherStore.getState().setError(null)
    expect(useWeatherStore.getState().error).toBeNull()
  })
})
