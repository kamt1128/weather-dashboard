"""
Tests para models de weather app.
"""

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from weather.models import WeatherData

pytestmark = pytest.mark.django_db


class TestWeatherDataModel:
    """Tests para el modelo WeatherData."""

    def test_weather_data_str(self):
        """Verifica que __str__ retorna formato correcto."""
        weather = WeatherData.objects.create(
            city='Madrid',
            temperature=22.5,
            humidity=65.0,
            wind_speed=12.3
        )
        assert 'Madrid' in str(weather)
        assert '22.5' in str(weather)
        assert str(weather).endswith('°C')

    def test_weather_data_creation(self):
        """Verifica que se puede crear un WeatherData válido."""
        weather = WeatherData.objects.create(
            city='Barcelona',
            temperature=20.0,
            humidity=70.0,
            wind_speed=8.5
        )
        assert weather.id is not None
        assert weather.city == 'Barcelona'
        assert weather.temperature == 20.0

    def test_temperature_validator_min(self):
        """Verifica que temperature >= -100."""
        weather = WeatherData(
            city='Test',
            temperature=-101.0,
            humidity=50.0,
            wind_speed=5.0
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_temperature_validator_max(self):
        """Verifica que temperature <= 100."""
        weather = WeatherData(
            city='Test',
            temperature=100.1,
            humidity=50.0,
            wind_speed=5.0
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_temperature_valid_extremes(self):
        """Verifica que temperature -100 a 100 son válidos."""
        weather = WeatherData(
            city='Test',
            temperature=-100.0,
            humidity=50.0,
            wind_speed=5.0
        )
        weather.full_clean()  # No debe lanzar

        weather.temperature = 100.0
        weather.full_clean()  # No debe lanzar

    def test_humidity_validator_min(self):
        """Verifica que humidity >= 0."""
        weather = WeatherData(
            city='Test',
            temperature=20.0,
            humidity=-0.1,
            wind_speed=5.0
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_humidity_validator_max(self):
        """Verifica que humidity <= 100."""
        weather = WeatherData(
            city='Test',
            temperature=20.0,
            humidity=100.1,
            wind_speed=5.0
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_humidity_valid_range(self):
        """Verifica que humidity 0-100 es válido."""
        weather = WeatherData(
            city='Test',
            temperature=20.0,
            humidity=0.0,
            wind_speed=5.0
        )
        weather.full_clean()  # No debe lanzar

        weather.humidity = 100.0
        weather.full_clean()  # No debe lanzar

    def test_wind_speed_validator(self):
        """Verifica que wind_speed >= 0."""
        weather = WeatherData(
            city='Test',
            temperature=20.0,
            humidity=50.0,
            wind_speed=-0.1
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_wind_speed_valid(self):
        """Verifica que wind_speed >= 0 es válido."""
        weather = WeatherData(
            city='Test',
            temperature=20.0,
            humidity=50.0,
            wind_speed=0.0
        )
        weather.full_clean()  # No debe lanzar

    def test_city_empty_validation(self):
        """Verifica que city no puede estar vacía."""
        weather = WeatherData(
            city='',
            temperature=20.0,
            humidity=50.0,
            wind_speed=5.0
        )
        with pytest.raises(ValidationError):
            weather.full_clean()

        weather.city = '   '
        with pytest.raises(ValidationError):
            weather.full_clean()

    def test_timestamp_default(self):
        """Verifica que timestamp tiene default a timezone.now."""
        weather = WeatherData.objects.create(
            city='Test',
            temperature=20.0,
            humidity=50.0,
            wind_speed=5.0
        )
        assert weather.timestamp is not None
        assert isinstance(weather.timestamp, type(timezone.now()))

    def test_ordering(self):
        """Verifica que el queryset por defecto ordena por -timestamp."""
        w1 = WeatherData.objects.create(city='A', temperature=20, humidity=50, wind_speed=5)
        w2 = WeatherData.objects.create(city='A', temperature=21, humidity=51, wind_speed=6)

        # w2 debe estar primero (ordenado por -timestamp)
        objs = list(WeatherData.objects.all())
        assert objs[0].id == w2.id
        assert objs[1].id == w1.id
