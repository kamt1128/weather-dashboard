"""
Celery tasks for weather application.
"""

import logging
from celery import shared_task
from django.db.models import Q
from weather.services import get_or_fetch_weather
from weather.models import WeatherData
from common.exceptions import OpenWeatherUnavailable

logger = logging.getLogger(__name__)


@shared_task
def refresh_weather(city: str) -> str:
    """
    Tarea Celery para refrescar datos climáticos de una ciudad.

    Args:
        city: Nombre de la ciudad

    Returns:
        String con nombre de ciudad y temperatura

    Raises:
        OpenWeatherUnavailable: Si falla la API y no hay fallback
    """
    try:
        weather_obj = get_or_fetch_weather(city)
        result = f"{weather_obj.city}: {weather_obj.temperature}°C"
        logger.info(f"refresh_weather completado: {result}")
        return result
    except OpenWeatherUnavailable as e:
        logger.error(f"refresh_weather falló para {city}: {str(e)}")
        raise


@shared_task
def refresh_subscribed_cities() -> str:
    """
    Tarea periódica (cada 10 min) que refresca las ciudades más recientemente consultadas.

    Obtiene las últimas 5 ciudades únicas del histórico de WeatherData
    y lanza un task refresh_weather para cada una.

    Returns:
        String con resumen de tareas lanzadas
    """
    try:
        # Obtiene las últimas 5 ciudades únicas (por timestamp descendente)
        recent_cities = (
            WeatherData.objects
            .values_list('city', flat=True)
            .distinct()
            .order_by('-timestamp')[:5]
        )

        if not recent_cities:
            logger.info("No hay ciudades en histórico para refrescar")
            return "No cities to refresh"

        logger.info(f"Refrescando ciudades: {list(recent_cities)}")

        # Lanza task async para cada ciudad
        for city in recent_cities:
            refresh_weather.delay(city)

        return f"Refresh tasks lanzadas para {len(recent_cities)} ciudades"

    except Exception as e:
        logger.error(f"Error en refresh_subscribed_cities: {str(e)}")
        raise
