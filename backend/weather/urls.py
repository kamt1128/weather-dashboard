"""
URL routing for weather API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from weather.views import WeatherDataViewSet, health

app_name = 'weather'

# Registra el router de DRF
router = DefaultRouter()
router.register(r'weather', WeatherDataViewSet, basename='weather')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health, name='health'),
]
