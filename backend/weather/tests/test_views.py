"""
Tests para views de weather app.
"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from weather.models import WeatherData

pytestmark = pytest.mark.django_db


class TestWeatherDataViewSet:
    """Tests para WeatherDataViewSet."""

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def sample_data(self):
        """Crea datos de prueba."""
        data = []
        for i in range(25):
            data.append(
                WeatherData.objects.create(
                    city='Madrid' if i < 15 else 'Barcelona',
                    temperature=20.0 + i,
                    humidity=50.0 + (i % 30),
                    wind_speed=5.0 + (i % 10)
                )
            )
        return data

    def test_list_paginated(self, client, sample_data):
        """Verifica que GET /weather/ retorna lista paginada."""
        response = client.get('/api/v1/weather/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert 'count' in response.data
        assert len(response.data['results']) == 20  # Default page size

    def test_filter_by_city(self, client, sample_data):
        """Verifica que se puede filtrar por city."""
        response = client.get('/api/v1/weather/?city=Madrid')

        assert response.status_code == status.HTTP_200_OK
        for item in response.data['results']:
            assert item['city'] == 'Madrid'

    def test_search_by_city(self, client, sample_data):
        """Verifica que se puede buscar por ciudad."""
        response = client.get('/api/v1/weather/?search=Barcelona')

        assert response.status_code == status.HTTP_200_OK
        for item in response.data['results']:
            assert 'Barcelona' in item['city']

    def test_detail_endpoint(self, client, sample_data):
        """Verifica GET /weather/{id}/."""
        weather = sample_data[0]
        response = client.get(f'/api/v1/weather/{weather.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == weather.id
        assert response.data['city'] == weather.city

    @patch('weather.views.get_or_fetch_weather')
    def test_dashboard_data_success(self, mock_fetch, client, sample_data):
        """Verifica GET /weather/dashboard-data/."""
        mock_fetch.side_effect = [sample_data[0], sample_data[1]]

        response = client.get(
            '/api/v1/weather/dashboard-data/?city1=Madrid&city2=Barcelona'
        )

        assert response.status_code == status.HTTP_200_OK
        assert 'Madrid' in response.data
        assert 'Barcelona' in response.data
        assert 'current' in response.data['Madrid']
        assert 'last_24h' in response.data['Madrid']

    def test_dashboard_data_missing_city1(self, client):
        """Verifica error si falta city1."""
        response = client.get('/api/v1/weather/dashboard-data/?city2=Barcelona')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_dashboard_data_invalid_city_format(self, client):
        """Verifica error si ciudad contiene caracteres inválidos."""
        response = client.get(
            '/api/v1/weather/dashboard-data/?city1=Madrid<script>&city2=Barcelona'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_export_csv_success(self, client, sample_data):
        """Verifica GET /weather/export-csv/."""
        response = client.get('/api/v1/weather/export-csv/')

        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'attachment' in response['Content-Disposition']
        assert 'weather.csv' in response['Content-Disposition']

    def test_export_csv_with_city_filter(self, client, sample_data):
        """Verifica export CSV filtrado por ciudad."""
        response = client.get('/api/v1/weather/export-csv/?city=Madrid')

        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode('utf-8')
        assert 'Madrid' in content
        assert 'Barcelona' not in content

    def test_export_csv_with_date_range(self, client, sample_data):
        """Verifica export CSV filtrado por rango de fechas."""
        # Obtiene la fecha del primer registro
        first_weather = sample_data[0]
        date_str = first_weather.timestamp.strftime('%Y-%m-%d')

        response = client.get(
            f'/api/v1/weather/export-csv/?start_date={date_str}&end_date={date_str}'
        )

        assert response.status_code == status.HTTP_200_OK

    def test_export_csv_invalid_date_format(self, client):
        """Verifica error si fecha está en formato inválido."""
        response = client.get(
            '/api/v1/weather/export-csv/?start_date=24-04-2026'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestHealthEndpoint:
    """Tests para health endpoint."""

    @pytest.fixture
    def client(self):
        return APIClient()

    def test_health_ok(self, client):
        """Verifica que /health/ retorna status ok."""
        response = client.get('/api/v1/health/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'ok'
