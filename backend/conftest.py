"""
Configuración pytest para weather-dashboard backend.
"""

import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializa Django antes de que pytest descubra los tests
django.setup()

pytest_plugins = ('pytest_django',)
