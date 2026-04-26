"""
Celery app configuration for weather_dashboard.
"""

import os
from celery import Celery
from celery.schedules import schedule

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('weather_dashboard')

# Load configuration from Django settings, all CELERY_ prefixed settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Celery Beat Schedule: tareas periódicas
app.conf.beat_schedule = {
    'refresh-weather-every-10-min': {
        'task': 'weather.tasks.refresh_subscribed_cities',
        'schedule': 600.0,  # 600 segundos = 10 minutos
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
