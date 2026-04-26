# Architecture Diagrams

## Diagrama de Componentes

Visualiza cómo los componentes principales del sistema interactúan entre sí:

```mermaid
graph TB
    User["Usuario"]
    FE["Frontend<br/>(React 18 + Vite)<br/>GitHub Pages"]
    Backend["Backend<br/>(Django 5 + DRF)<br/>Render"]
    Postgres["PostgreSQL 16<br/>(Render Managed)"]
    Redis["Redis 7<br/>(Render Managed)"]
    OpenWeather["OpenWeather API"]
    Celery["Celery Worker"]
    Beat["Celery Beat<br/>(Scheduler)"]
    
    User -->|HTTP/WebSocket| FE
    FE -->|REST API + WebSocket| Backend
    Backend -->|Query/Update| Postgres
    Backend -->|Cache/Broker| Redis
    Backend -->|Fetch Weather| OpenWeather
    Celery -->|Consume Tasks| Redis
    Celery -->|Update| Postgres
    Beat -->|Schedule Tasks| Redis
    Celery -->|Emit Events| Backend
    Backend -->|Broadcast| FE
```

## Diagrama de Secuencia

Muestra el flujo de una solicitud de clima desde el usuario hasta la visualización:

```mermaid
sequenceDiagram
    User->>Frontend: Click "Add City" / Refresh
    Frontend->>Backend: GET /api/v1/weather/?cities=...
    Backend->>Redis: Check Cache
    alt Cache Hit
        Redis-->>Backend: Cached Data
    else Cache Miss
        Backend->>OpenWeather: Fetch Weather Data
        OpenWeather-->>Backend: JSON Response
        Backend->>Postgres: Store Latest Data
        Backend->>Redis: Cache (TTL 600s)
    end
    Backend-->>Frontend: JSON Response
    Frontend->>Frontend: Update State (Zustand)
    Frontend->>Frontend: Render Charts (Recharts)
    Frontend-->>User: Display Dashboard
    
    Note over Backend,Redis: WebSocket Connection
    Celery->>Backend: Task Completed
    Backend->>Redis: Publish weather.update
    Backend-->>Frontend: WebSocket Event
    Frontend->>Frontend: Live Update (No reload)
    Frontend-->>User: Real-time Alert
```

## Diagrama de Despliegue

Muestra cómo el código se propaga desde el repositorio hasta los usuarios:

```mermaid
graph LR
    Repo["GitHub Repo<br/>(Monorepo)"]
    GHA["GitHub Actions<br/>(CI/CD)"]
    GHPages["GitHub Pages<br/>(Frontend)"]
    Render["Render.com<br/>(Backend)"]
    Users["Usuarios"]
    
    Repo -->|Push a main| GHA
    GHA -->|Build + Test| GHA
    GHA -->|Deploy| GHPages
    GHA -->|Webhook| Render
    Render -->|Auto-deploy| Render
    GHPages -->|Served| Users
    Render -->|API + WebSocket| Users
    
    style Repo fill:#ff9999
    style GHA fill:#99ccff
    style GHPages fill:#99ff99
    style Render fill:#ffcc99
    style Users fill:#cccccc
```
