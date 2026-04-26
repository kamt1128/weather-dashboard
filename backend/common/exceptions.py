"""
Custom exceptions for weather_dashboard.
"""

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class OpenWeatherUnavailable(Exception):
    """
    Se lanza cuando OpenWeather API no está disponible.
    Incluye manejo de timeouts, errores de conexión y rate limits.
    """
    pass


class CacheError(Exception):
    """Se lanza cuando hay error accediendo a Redis cache."""
    pass


class APIError(Exception):
    """Excepción base para errores de API."""
    pass


def custom_exception_handler(exc, context):
    """
    Handler personalizado para excepciones en DRF.
    Loguea errores y retorna respuestas apropiadas.
    """
    from rest_framework.views import exception_handler

    # Loguea la excepción
    logger.error(
        f"Exception: {exc.__class__.__name__}",
        exc_info=True,
        extra={'context': str(context)}
    )

    # Manejo de excepciones personalizadas
    if isinstance(exc, OpenWeatherUnavailable):
        return Response(
            {
                'error': 'OpenWeather API no disponible',
                'detail': 'Intente más tarde. Mostrando datos del cache si están disponibles.'
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    if isinstance(exc, CacheError):
        logger.warning("Redis cache error, fallback a DB")
        return Response(
            {'error': 'Cache error', 'detail': 'Usando base de datos directamente'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Delega al handler por defecto de DRF
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'error': response.data.get('detail', 'Error desconocido'),
            'detail': str(response.data)
        }

    return response
