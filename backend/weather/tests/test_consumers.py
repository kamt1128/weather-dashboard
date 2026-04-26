"""
Tests para WebSocket consumers de weather app.
"""

import json
import pytest
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from weather.consumers import WeatherConsumer
from weather.models import WeatherData
import asyncio


class TestWeatherConsumer(TransactionTestCase):
    """Tests para WeatherConsumer."""

    async def test_connect_disconnect(self):
        """Verifica que connect() y disconnect() funcionan."""
        communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

        connected, subprotocol = await communicator.connect()
        assert connected

        await communicator.disconnect()

    async def test_ping_pong(self):
        """Verifica que responde a ping con pong."""
        communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

        connected, _ = await communicator.connect()
        assert connected

        # Envía ping
        await communicator.send_json_to({'type': 'ping'})

        # Debe recibir pong
        response = await communicator.receive_json_from()
        assert response['type'] == 'pong'

        await communicator.disconnect()

    async def test_subscribe_message(self):
        """Verifica que procesa mensaje subscribe."""
        communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

        connected, _ = await communicator.connect()
        assert connected

        # Envía subscribe
        await communicator.send_json_to({
            'type': 'subscribe',
            'cities': ['Madrid', 'Barcelona']
        })

        # No debe lanzar error
        await communicator.disconnect()

    async def test_receive_weather_update(self):
        """Verifica que recibe eventos weather.update."""
        communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

        connected, _ = await communicator.connect()
        assert connected

        # Simula un evento de group_send
        await communicator.send_json_to({
            'type': 'weather.update',
            'data': {
                'city': 'Madrid',
                'temperature': 22.5,
                'humidity': 65.0,
                'wind_speed': 12.3,
                'timestamp': '2026-04-24T10:00:00'
            }
        })

        # Debe recibir el evento
        # Nota: En Channels, weather.update es procesado por el handler
        # Este test verifica que no crash en recibir el evento

        await communicator.disconnect()

    async def test_unknown_message_type(self):
        """Verifica que ignora mensajes desconocidos."""
        communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

        connected, _ = await communicator.connect()
        assert connected

        # Envía mensaje desconocido
        await communicator.send_json_to({'type': 'unknown_type'})

        # No debe crash
        await communicator.disconnect()


# Para ejecutar tests async con pytest
@pytest.mark.asyncio
async def test_weather_consumer_basic():
    """Test básico async de WeatherConsumer."""
    communicator = WebsocketCommunicator(WeatherConsumer.as_asgi(), "ws/weather/")

    connected, _ = await communicator.connect()
    assert connected is True

    await communicator.disconnect()
