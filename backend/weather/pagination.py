"""
Pagination classes for weather API.
"""

from rest_framework.pagination import PageNumberPagination


class WeatherPageNumberPagination(PageNumberPagination):
    """
    Pagination para /weather/ con soporte de page_size configurable por query param.
    """

    page_size_query_param = 'page_size'
    max_page_size = 100
