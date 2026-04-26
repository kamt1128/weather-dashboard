"""
URL configuration for weather_dashboard.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('weather.urls')),
]
