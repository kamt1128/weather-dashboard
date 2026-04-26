"""
WebSocket routing for weather application.
"""

from django.urls import re_path
from weather.consumers import WeatherConsumer

websocket_urlpatterns = [
    re_path(r'ws/weather/$', WeatherConsumer.as_asgi(), name='weather-websocket'),
]
