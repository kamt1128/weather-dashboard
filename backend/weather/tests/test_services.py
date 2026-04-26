"""
Tests para services de weather app.
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from django.core.cache import cache
from requests.exceptions import Timeout, ConnectionError

from weather.services import OpenWeatherService, get_or_fetch_weather
from weather.models import WeatherData
from common.exceptions import OpenWeatherUnavailable

pytestmark = pytest.mark.django_db


class TestOpenWeatherService:
    """Tests para OpenWeatherService."""

    @patch('weather.services.requests.Session.get')
    def test_fetch_current_success(self, mock_get):
        """Verifica fetch exitoso de OpenWeather API."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'main': {'temp': 22.5, 'humidity': 65},
            'wind': {'speed': 12.3}
        }
        mock_get.return_value = mock_response

        result = OpenWeatherService.fetch_current('Madrid')

        assert result['city'] == 'Madrid'
        assert result['temperature'] == 22.5
        assert result['humidity'] == 65.0
        assert result['wind_speed'] == 12.3

    @patch('weather.services.requests.Session.get')
    def test_fetch_current_timeout_retry(self, mock_get):
        """Verifica reintentos en caso de Timeout."""
        # Primer intento: Timeout, segundo: exitoso
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'main': {'temp': 20.0, 'humidity': 70},
            'wind': {'speed': 5.0}
        }

        mock_get.side_effect = [Timeout(), mock_response]

        result = OpenWeatherService.fetch_current('Barcelona')

        assert result['city'] == 'Barcelona'
        assert result['temperature'] == 20.0

    @patch('weather.services.requests.Session.get')
    def test_fetch_current_max_retries_exceeded(self, mock_get):
        """Verifica que lanza excepción después de reintentos."""
        mock_get.side_effect = Timeout()

        with pytest.raises(OpenWeatherUnavailable):
            OpenWeatherService.fetch_current('Valencia')

    @patch('weather.services.requests.Session.get')
    def test_fetch_current_city_not_found(self, mock_get):
        """Verifica manejo de ciudad no encontrada (404)."""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = Exception("404 Not Found")

        mock_get.return_value = mock_response

        with pytest.raises(OpenWeatherUnavailable):
            OpenWeatherService.fetch_current('CiudadNoExiste')

    @patch('weather.services.requests.Session.get')
    def test_fetch_current_connection_error(self, mock_get):
        """Verifica manejo de ConnectionError."""
        mock_get.side_effect = ConnectionError()

        with pytest.raises(OpenWeatherUnavailable):
            OpenWeatherService.fetch_current('Madrid')


class TestGetOrFetchWeather:
    """Tests para función get_or_fetch_weather."""

    def test_cache_hit(self):
        """Verifica que retorna datos cacheados."""
        weather = WeatherData.objects.create(
            city='Madrid',
            temperature=22.5,
            humidity=65.0,
            wind_speed=12.3
        )
        cache_key = f"weather:madrid"
        cache.set(cache_key, weather, 600)

        result = get_or_fetch_weather('Madrid')

        assert result.id == weather.id
        assert result.city == 'Madrid'

    @patch('weather.services.OpenWeatherService.fetch_current')
    @patch('weather.services._emit_weather_update')
    def test_cache_miss_api_success(self, mock_emit, mock_fetch):
        """Verifica fetch de API cuando hay cache miss."""
        mock_fetch.return_value = {
            'city': 'Madrid',
            'temperature': 22.5,
            'humidity': 65.0,
            'wind_speed': 12.3,
            'timestamp': '2026-04-24T10:00:00'
        }

        cache.delete("weather:madrid")

        result = get_or_fetch_weather('Madrid')

        assert result.city == 'Madrid'
        assert result.temperature == 22.5
        mock_emit.assert_called_once()

    @patch('weather.services.OpenWeatherService.fetch_current')
    def test_api_failure_fallback_to_db(self, mock_fetch):
        """Verifica fallback a DB cuando API falla."""
        # Crea un registro previo
        old_weather = WeatherData.objects.create(
            city='Madrid',
            temperature=20.0,
            humidity=60.0,
            wind_speed=10.0
        )

        mock_fetch.side_effect = OpenWeatherUnavailable("API down")

        result = get_or_fetch_weather('Madrid')

        assert result.id == old_weather.id
        assert result.temperature == 20.0

    @patch('weather.services.OpenWeatherService.fetch_current')
    def test_api_failure_no_db_fallback(self, mock_fetch):
        """Verifica que lanza excepción si API falla y no hay DB."""
        mock_fetch.side_effect = OpenWeatherUnavailable("API down")

        cache.delete("weather:paris")
        WeatherData.objects.filter(city__iexact='Paris').delete()

        with pytest.raises(OpenWeatherUnavailable):
            get_or_fetch_weather('Paris')

    @patch('weather.services.OpenWeatherService.fetch_current')
    @patch('weather.services._emit_weather_update')
    def test_caches_result_after_fetch(self, mock_emit, mock_fetch):
        """Verifica que cachea resultado después de fetch."""
        mock_fetch.return_value = {
            'city': 'Barcelona',
            'temperature': 20.0,
            'humidity': 70.0,
            'wind_speed': 8.5,
            'timestamp': '2026-04-24T10:00:00'
        }

        cache.delete("weather:barcelona")

        result1 = get_or_fetch_weather('Barcelona')
        mock_fetch.reset_mock()
        result2 = get_or_fetch_weather('Barcelona')

        # Segunda llamada no debe hacer fetch
        mock_fetch.assert_not_called()
        assert result1.temperature == result2.temperature
