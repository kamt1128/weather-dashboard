"""
Models for weather application.
"""

import logging
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

logger = logging.getLogger(__name__)


class WeatherData(models.Model):
    """
    Almacena datos meteorológicos de una ciudad en un momento específico.
    """
    city = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Nombre de la ciudad"
    )
    temperature = models.FloatField(
        validators=[MinValueValidator(-100), MaxValueValidator(100)],
        help_text="Temperatura en Celsius"
    )
    humidity = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Humedad en porcentaje (0-100)"
    )
    wind_speed = models.FloatField(
        validators=[MinValueValidator(0)],
        help_text="Velocidad del viento en m/s"
    )
    timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Marca de tiempo del dato"
    )

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['city', '-timestamp']),
        ]
        verbose_name = "Dato Meteorológico"
        verbose_name_plural = "Datos Meteorológicos"

    def __str__(self) -> str:
        """Representación en string del modelo."""
        return f"{self.city} @ {self.timestamp.isoformat()}: {self.temperature}°C"

    def clean(self):
        """Validación de integridad del modelo."""
        from django.core.exceptions import ValidationError

        if not self.city or not self.city.strip():
            raise ValidationError({'city': 'Ciudad no puede estar vacía.'})
        if not (-100 <= self.temperature <= 100):
            raise ValidationError({'temperature': 'Temperatura debe estar entre -100 y 100°C.'})
        if not (0 <= self.humidity <= 100):
            raise ValidationError({'humidity': 'Humedad debe estar entre 0 y 100%.'})
        if self.wind_speed < 0:
            raise ValidationError({'wind_speed': 'Velocidad del viento no puede ser negativa.'})
