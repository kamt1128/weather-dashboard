"""
Serializers for weather API.
"""

import re
from rest_framework import serializers
from weather.models import WeatherData


class WeatherDataSerializer(serializers.ModelSerializer):
    """
    Serializer para WeatherData.
    Incluye todos los campos del modelo.
    """

    class Meta:
        model = WeatherData
        fields = ['id', 'city', 'temperature', 'humidity', 'wind_speed', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class CitySearchSerializer(serializers.Serializer):
    """
    Serializer para validar query params de búsqueda de ciudad.
    Previene inyección SQL/XSS validando caracteres permitidos.
    """
    city = serializers.CharField(
        required=True,
        max_length=100,
        min_length=1,
        help_text="Nombre de la ciudad"
    )

    def validate_city(self, value: str) -> str:
        """
        Valida que la ciudad solo contenga caracteres alfanuméricos, espacios y acentos.
        """
        # Patrón: letras, números, espacios, ñ, acentos (áéíóú), guiones
        pattern = r'^[a-zA-Z0-9\s\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00e1\u00e9\u00ed\u00f3\u00fa\-]+$'

        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Ciudad solo puede contener letras, números, espacios, guiones y acentos."
            )

        # Asegura que no sea solo espacios
        if not value.strip():
            raise serializers.ValidationError("Ciudad no puede estar vacía.")

        return value.strip()


class DashboardDataSerializer(serializers.Serializer):
    """
    Serializer para endpoint /dashboard-data/.

    Contrato (alineado con frontend TypeScript):
        {
          "city1": { "name": str, "latest": WeatherData, "history": WeatherData[] },
          "city2": { "name": str, "latest": WeatherData, "history": WeatherData[] }
        }

    Las keys "city1" y "city2" son fijas (no varían con el nombre real de la ciudad),
    lo que simplifica el tipado en el frontend y desacopla el contrato del input.
    """

    def to_representation(self, data):
        """Serializa la estructura {city1, city2} con nested WeatherDataSerializer."""
        def serialize_city(city_payload):
            return {
                'name': city_payload.get('name', ''),
                'latest': WeatherDataSerializer(city_payload['latest']).data
                if city_payload.get('latest') else None,
                'history': WeatherDataSerializer(city_payload.get('history', []), many=True).data,
            }

        if isinstance(data, dict) and 'city1' in data and 'city2' in data:
            return {
                'city1': serialize_city(data['city1']),
                'city2': serialize_city(data['city2']),
            }
        return data
