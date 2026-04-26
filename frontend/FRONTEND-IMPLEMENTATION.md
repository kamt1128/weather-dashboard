# Weather Dashboard Frontend - Implementación Completa

## Descripción General

Se ha implementado un frontend completo para "Weather Real-Time Dashboard" en React 18 + TypeScript con Vite, Ant Design 5, Zustand, Recharts y Dexie para almacenamiento offline.

## Archivos Creados y Modificados

### Servicios (src/services/)
- **api.ts** - Cliente HTTP con axios, interceptores de error, funciones para fetchWeatherList, fetchDashboard, exportCsvUrl, healthCheck
- **websocket.ts** - WebSocketManager con reconexión exponencial (1s → 30s max), ping/pong cada 25s, suscripción a ciudades, eventos personalizados
- **storage.ts** - Dexie/IndexedDB con tablas: weather, dashboard, pendingSync. Funciones de caché con bulk operations

### Stores (src/store/)
- **weatherStore.ts** - Zustand: city1, city2, dashboard, liveUpdates (max 50), loading, error
- **uiStore.ts** - Zustand: isOnline, wsStatus (connecting|online|offline), printMode

### Hooks (src/hooks/)
- **useWebSocket.ts** - Conecta WS al montar, resuscribe cuando cambian ciudades, cachea mensajes
- **useOffline.ts** - Listeners window.online/offline, sincroniza con uiStore
- **useWeatherData.ts** - useDashboard() y useWeatherList() con fallback offline a Dexie

### Componentes (src/components/)
- **Layout.tsx** - Header con título, status tag (verde/naranja/rojo), botón imprimir; Footer Enersinc
- **OfflineIndicator.tsx** - Alert warning si offline, spinner si conectando
- **ErrorBoundary.tsx** - Class component con componentDidCatch, Result fallback
- **LoadingSpinner.tsx** - Wrapper Spin con texto

### Features
- **dashboard/Dashboard.tsx** - Selectores ciudad con autocompletar, cards ciudad1/ciudad2, gráfico comparativo, lista últimas actualizaciones
- **dashboard/CityCard.tsx** - Card con temperatura grande, humedad%, viento m/s, timestamp relativo, icono weather
- **dashboard/TimeSeriesChart.tsx** - LineChart Recharts dual-ciudad, toggle métrica (temp/humedad/viento)
- **weather-table/WeatherTable.tsx** - Tabla paginada (20/50/100), filtro ciudad, botón exportar CSV directo

### Utils
- **utils/formatting.ts** - formatTemperature/Humidity/Wind, formatDatetime/Timestamp (dayjs), getWeatherIcon (emoji)
- **utils/api.ts** - buildQueryString, parseError (AxiosError)

### Types (src/types/)
- **weather.ts** - WeatherData, PaginatedResponse, DashboardCity, DashboardData, WSMessage, ConnectionStatus

### Tests (src/__tests__/)
- **services/api.test.ts** - Verify fetchWeatherList params, CSV URL generation
- **store/weatherStore.test.ts** - Test actions (setCity, pushLiveUpdate limit 50)
- **utils/formatting.test.ts** - Test formatters y getWeatherIcon
- **setup.ts** - Import @testing-library/jest-dom

### Configuración
- **vitest.config.ts** - jsdom, setupFiles, alias @/
- **vite.config.ts** - Base /weather-dashboard/, proxy /api y /ws/weather
- **tsconfig.json** - strict: true, paths @/, jsx react-jsx

## Decisiones Técnicas Clave

1. **WebSocket Singleton** - wsManager exportado como singleton para gestión centralizada
2. **Caché Dual** - IndexedDB para persistencia offline + Zustand para estado UI rápido
3. **Backoff Exponencial** - 1s, 2s, 4s, 8s, 16s, max 30s (no 5 como inicial)
4. **Live Updates Buffer** - Max 50 items en liveUpdates para no saturar memoria
5. **Offline Fallback** - Si falla fetch, intenta caché; si no hay caché, error claro
6. **Responsive** - Ant Design breakpoints (xs/sm/md), tabs para navegación
7. **TypeScript Strict** - No `any`, tipos explícitos en interfaces
8. **Print Mode** - CSS @media print oculta UI, landscape, sin sombras

## Flujos Principales

### Dashboard Load
1. useWebSocket hook se conecta y suscribe a [city1, city2]
2. useDashboard fetches from API o caché (según isOnline)
3. Recharts actualiza con history
4. WS mensajes alimentan liveUpdates en tiempo real

### Offline Mode
1. Window.offline dispara setOnline(false)
2. Componentes fallback a getCachedWeather/getCachedDashboard
3. OfflineIndicator muestra warning
4. Al reconectar, refetch automático

### Print
1. Button "Imprimir" setea printMode=true, window.print()
2. CSS @media print oculta header/nav, landscape, optimiza espacios
3. Después de print(), setPrintMode(false)

## Testing

Configurado con Vitest + @testing-library/react. Archivos de test cubre:
- API functions (params, URLs)
- Store mutations (adicionar, limitar)
- Formatters (output correcto)
- Componentes (render básico)

Ejecutar: `npm run test`

## Notas para el Orquestador

1. **Backend Endpoint Validation**: El backend debe exponer `/weather/dashboard-data/?city1=X&city2=Y` con respuesta `{ city1: { latest, history }, city2: {...} }`
2. **WebSocket Auth**: Implementación actual sin autenticación. Si se requiere, agregar handshake con token
3. **CSV Export**: Ejecutado vía window.location (descarga directa). Alternativa: blob en frontend
4. **Locale**: Configurado es_ES (dayjs, AntD). Fácil cambiar en App.tsx
5. **Mobile**: Completamente responsive con Ant Design, funciona en mobile con ajustes CSS

## Cobertura de Especificaciones

- ✅ Zustand para estado global
- ✅ Recharts para gráficos tiempo real
- ✅ Dexie/IndexedDB para offline
- ✅ WebSocket con reconexión backoff
- ✅ Ping/Pong 25s
- ✅ Animaciones (highlight @keyframes)
- ✅ Modo print CSS
- ✅ Error boundary
- ✅ Tests con Vitest
- ✅ TypeScript strict
- ✅ AntD v5 con ConfigProvider + locale
