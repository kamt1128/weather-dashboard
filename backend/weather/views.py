"""
Views for weather API.
"""

import csv
import logging
from datetime import datetime, timedelta
from typing import Dict, List

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from weather.models import WeatherData
from weather.serializers import WeatherDataSerializer, CitySearchSerializer, DashboardDataSerializer
from weather.services import get_or_fetch_weather
from common.exceptions import OpenWeatherUnavailable

logger = logging.getLogger(__name__)


class WeatherDataViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para operaciones CRUD (solo lectura) de WeatherData.

    Endpoints:
    - GET /weather/ - lista paginada
    - GET /weather/?city=... - filtrado por ciudad
    - GET /weather/{id}/ - detalle
    - GET /weather/dashboard-data/?city1=...&city2=... - datos optimizados
    - GET /weather/export-csv/?city=...&start_date=...&end_date=... - exportación CSV
    """

    queryset = WeatherData.objects.all()
    serializer_class = WeatherDataSerializer
    filterset_fields = ['city']
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['city']
    pagination_class = None  # Usa la configurada en settings (PageNumberPagination, page_size=20)

    @action(detail=False, methods=['get'], url_path='dashboard-data')
    def dashboard_data(self, request):
        """
        Endpoint optimizado para dashboard: retorna datos actuales + histórico de 24h
        para dos ciudades seleccionadas.

        Query params:
        - city1 (required): Primera ciudad
        - city2 (required): Segunda ciudad

        Response:
        {
            "city1": {
                "current": {WeatherData},
                "last_24h": [{WeatherData}, ...]
            },
            "city2": {...}
        }
        """
        # Valida query params
        city1 = request.query_params.get('city1')
        city2 = request.query_params.get('city2')

        if not city1 or not city2:
            return Response(
                {'error': 'city1 y city2 son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Valida formato
        serializer = CitySearchSerializer(data={'city': city1})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = CitySearchSerializer(data={'city': city2})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        city1 = city1.strip()
        city2 = city2.strip()

        try:
            # Obtiene datos frescos de API/cache para ambas ciudades
            current1 = get_or_fetch_weather(city1)
            current2 = get_or_fetch_weather(city2)

            # Obtiene histórico de últimas 24h
            now = timezone.now()
            last_24h_ago = now - timedelta(hours=24)

            history1 = WeatherData.objects.filter(
                city__iexact=city1,
                timestamp__gte=last_24h_ago
            ).order_by('-timestamp')[:24]

            history2 = WeatherData.objects.filter(
                city__iexact=city2,
                timestamp__gte=last_24h_ago
            ).order_by('-timestamp')[:24]

            # Estructura alineada con el contrato del frontend (keys fijos
            # "city1"/"city2", campos "latest"/"history"). Esto evita acoplar
            # al frontend al nombre exacto de la ciudad y simplifica el tipado TS.
            data = {
                'city1': {
                    'name': city1,
                    'latest': current1,
                    'history': list(history1),
                },
                'city2': {
                    'name': city2,
                    'latest': current2,
                    'history': list(history2),
                },
            }

            return Response(DashboardDataSerializer().to_representation(data))

        except OpenWeatherUnavailable as e:
            logger.error(f"Dashboard data error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Unexpected error en dashboard_data: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        """
        Exporta datos en formato CSV usando StreamingHttpResponse.
        No carga todo en memoria, mejor para datasets grandes.

        Query params (opcionales):
        - city: Filtrar por ciudad
        - start_date: Fecha inicio (YYYY-MM-DD)
        - end_date: Fecha fin (YYYY-MM-DD)

        Response: CSV file
        """
        try:
            queryset = WeatherData.objects.all()

            # Aplica filtros
            city = request.query_params.get('city')
            if city:
                serializer = CitySearchSerializer(data={'city': city})
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                queryset = queryset.filter(city__iexact=city.strip())

            start_date = request.query_params.get('start_date')
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d')
                    queryset = queryset.filter(timestamp__gte=start)
                except ValueError:
                    return Response(
                        {'error': 'start_date debe ser YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            end_date = request.query_params.get('end_date')
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d')
                    end = end.replace(hour=23, minute=59, second=59)
                    queryset = queryset.filter(timestamp__lte=end)
                except ValueError:
                    return Response(
                        {'error': 'end_date debe ser YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            queryset = queryset.order_by('-timestamp')

            # Streaming CSV
            def csv_generator():
                writer = None
                for idx, obj in enumerate(queryset.iterator(chunk_size=1000)):
                    if idx == 0:
                        # Headers en primera fila
                        yield 'city,temperature,humidity,wind_speed,timestamp\n'

                    row = f'{obj.city},{obj.temperature},{obj.humidity},{obj.wind_speed},{obj.timestamp.isoformat()}\n'
                    yield row

            response = StreamingHttpResponse(csv_generator(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="weather.csv"'
            return response

        except Exception as e:
            logger.error(f"Error en export_csv: {str(e)}")
            return Response(
                {'error': 'Error generando CSV'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@action(detail=False, methods=['get'])
def health(request):
    """
    Health check endpoint.
    """
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
