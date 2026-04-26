"""
Business logic services for weather application.
"""

import json
import logging
from typing import Dict, Optional
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from common.exceptions import OpenWeatherUnavailable
from weather.models import WeatherData

logger = logging.getLogger(__name__)


class OpenWeatherService:
    """
    Servicio para consumir OpenWeather API con reintentos y manejo robusto de errores.
    """

    OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
    TIMEOUT = 10
    MAX_RETRIES = 3
    BACKOFF_FACTORS = [1, 2, 4]  # segundos

    @classmethod
    def fetch_current(cls, city: str) -> Dict:
        """
        Obtiene datos climáticos actuales de OpenWeather API.

        Args:
            city: Nombre de la ciudad

        Returns:
            Dict con estructura normalizada: {city, temperature, humidity, wind_speed, timestamp}

        Raises:
            OpenWeatherUnavailable: Si falla la API después de reintentos
        """
        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            logger.error("OPENWEATHER_API_KEY no configurada")
            raise OpenWeatherUnavailable("API key no configurada")

        params = {
            'q': city,
            'appid': api_key,
            'units': 'metric'
        }

        session = requests.Session()
        retry_strategy = Retry(
            total=cls.MAX_RETRIES,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        last_error = None
        for attempt in range(cls.MAX_RETRIES):
            try:
                logger.info(f"OpenWeather API call for {city} (attempt {attempt + 1}/{cls.MAX_RETRIES})")
                response = session.get(
                    cls.OPENWEATHER_URL,
                    params=params,
                    timeout=cls.TIMEOUT
                )
                response.raise_for_status()

                data = response.json()
                return cls._normalize_response(data, city)

            except requests.exceptions.Timeout as e:
                last_error = e
                logger.warning(f"Timeout en attempt {attempt + 1} para {city}")
                if attempt < cls.MAX_RETRIES - 1:
                    backoff = cls.BACKOFF_FACTORS[attempt]
                    import time
                    time.sleep(backoff)

            except requests.exceptions.ConnectionError as e:
                last_error = e
                logger.warning(f"ConnectionError en attempt {attempt + 1} para {city}")
                if attempt < cls.MAX_RETRIES - 1:
                    backoff = cls.BACKOFF_FACTORS[attempt]
                    import time
                    time.sleep(backoff)

            except requests.exceptions.HTTPError as e:
                logger.error(f"HTTP Error {response.status_code} para {city}: {str(e)}")
                if response.status_code == 404:
                    raise OpenWeatherUnavailable(f"Ciudad {city} no encontrada")
                elif response.status_code == 401:
                    raise OpenWeatherUnavailable("API key inválida")
                last_error = e
                break  # No reintentar en errors 4xx

            except Exception as e:
                logger.error(f"Error inesperado para {city}: {str(e)}")
                last_error = e
                break

        logger.error(f"OpenWeather API falló para {city} después de {cls.MAX_RETRIES} intentos")
        raise OpenWeatherUnavailable(f"No se pudo obtener datos para {city}") from last_error

    @staticmethod
    def _normalize_response(data: Dict, city: str) -> Dict:
        """Normaliza respuesta de OpenWeather a formato interno."""
        return {
            'city': city,
            'temperature': float(data['main']['temp']),
            'humidity': float(data['main']['humidity']),
            'wind_speed': float(data['wind'].get('speed', 0)),
            'timestamp': timezone.now().isoformat()
        }


def get_or_fetch_weather(city: str) -> WeatherData:
    """
    Obtiene datos climáticos de cache, API o DB (con fallback).

    Flujo:
    1. Busca en Redis cache (TTL 600s)
    2. Si HIT -> retorna cached data
    3. Si MISS -> llama OpenWeather API
    4. Si API OK -> guarda en DB + cache + emite WS event
    5. Si API falla -> fallback a último registro en DB
    6. Si tampoco hay en DB -> propaga excepción

    Args:
        city: Nombre de la ciudad

    Returns:
        WeatherData guardado/cacheado

    Raises:
        OpenWeatherUnavailable: Si API falla y no hay fallback en DB
    """
    cache_key = f"weather:{city.lower()}"
    city_clean = city.strip()

    # 1. Intenta cache
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"Cache HIT para {city_clean}")
        return cached

    logger.info(f"Cache MISS para {city_clean}")

    # 2. Intenta API
    try:
        api_data = OpenWeatherService.fetch_current(city_clean)

        # 3. Guarda en DB
        weather_obj = WeatherData.objects.create(
            city=city_clean,
            temperature=api_data['temperature'],
            humidity=api_data['humidity'],
            wind_speed=api_data['wind_speed'],
            timestamp=timezone.now()
        )
        logger.info(f"WeatherData guardado para {city_clean}")

        # 4. Guarda en cache (TTL 600s)
        cache.set(cache_key, weather_obj, 600)

        # 5. Emite evento WebSocket
        _emit_weather_update(weather_obj)

        return weather_obj

    except OpenWeatherUnavailable as e:
        logger.warning(f"API falló para {city_clean}, intentando fallback a DB")

        # 6. Fallback a último registro en DB
        last_weather = WeatherData.objects.filter(city__iexact=city_clean).order_by('-timestamp').first()
        if last_weather:
            logger.info(f"Usando datos del DB (stale) para {city_clean}")
            cache.set(cache_key, last_weather, 300)  # cache corto para fallback
            return last_weather

        # 7. Si tampoco hay en DB, propaga excepción
        logger.error(f"No hay datos en cache ni DB para {city_clean}")
        raise


def _emit_weather_update(weather_obj: WeatherData) -> None:
    """
    Emite evento weather.update a través de WebSocket channel layer.
    """
    try:
        channel_layer = get_channel_layer()
        event_data = {
            'city': weather_obj.city,
            'temperature': weather_obj.temperature,
            'humidity': weather_obj.humidity,
            'wind_speed': weather_obj.wind_speed,
            'timestamp': weather_obj.timestamp.isoformat()
        }

        async_to_sync(channel_layer.group_send)(
            'weather_updates',
            {
                'type': 'weather.update',
                'data': event_data
            }
        )
        logger.debug(f"WebSocket event emitido para {weather_obj.city}")

    except Exception as e:
        logger.warning(f"Error emitiendo WebSocket event: {str(e)}")
