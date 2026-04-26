"""
WebSocket consumers for weather application.
"""

import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class WeatherConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer para /ws/weather/.

    Lifecycle:
    - connect(): acepta conexión, añade cliente a grupo 'weather_updates'
    - disconnect(): remueve cliente del grupo
    - receive_json(data): procesa mensajes JSON del cliente
    - weather_update(event): handler para eventos de tipo 'weather.update'
    - ping/pong: mantiene conexión viva

    Mensajes esperados del cliente:
    - {type: 'subscribe', cities: ['city1', 'city2']}
    - {type: 'ping'}

    Eventos emitidos al cliente:
    - {type: 'weather.update', city, temperature, humidity, wind_speed, timestamp}
    - {type: 'pong'}
    """

    async def connect(self):
        """Acepta conexión y añade cliente al grupo 'weather_updates'."""
        await self.accept()
        await self.channel_layer.group_add('weather_updates', self.channel_name)
        logger.info(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        """Remueve cliente del grupo al desconectar."""
        await self.channel_layer.group_discard('weather_updates', self.channel_name)
        logger.info(f"WebSocket disconnected: {self.channel_name} (code: {close_code})")

    async def receive_json(self, data, **kwargs):
        """
        Procesa mensajes JSON del cliente.

        Soporta:
        - subscribe: {type: 'subscribe', cities: ['Madrid', 'Barcelona']}
        - ping: {type: 'ping'}
        """
        message_type = data.get('type', 'unknown')

        if message_type == 'subscribe':
            cities = data.get('cities', [])
            logger.debug(f"Subscribe request para ciudades: {cities}")
            # En futuros, podría filtrar eventos por ciudad específica
            # Por ahora, todos reciben todos los eventos

        elif message_type == 'ping':
            await self.send_json({'type': 'pong'})
            logger.debug(f"Ping/Pong: {self.channel_name}")

        else:
            logger.warning(f"Unknown message type: {message_type}")

    async def weather_update(self, event):
        """
        Handler para eventos type='weather.update' del channel layer.
        Emite datos climáticos al cliente.
        """
        data = event.get('data', {})
        await self.send_json({
            'type': 'weather.update',
            'payload': data
        })
        logger.debug(f"Weather update enviado a {self.channel_name}: {data.get('city')}")
