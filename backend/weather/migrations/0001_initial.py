# Generated migration for WeatherData model

from django.db import migrations, models
import django.db.models.functions
import django.utils.timezone
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='WeatherData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('city', models.CharField(db_index=True, help_text='Nombre de la ciudad', max_length=100)),
                ('temperature', models.FloatField(
                    help_text='Temperatura en Celsius',
                    validators=[django.core.validators.MinValueValidator(-100), django.core.validators.MaxValueValidator(100)]
                )),
                ('humidity', models.FloatField(
                    help_text='Humedad en porcentaje (0-100)',
                    validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]
                )),
                ('wind_speed', models.FloatField(
                    help_text='Velocidad del viento en m/s',
                    validators=[django.core.validators.MinValueValidator(0)]
                )),
                ('timestamp', models.DateTimeField(db_index=True, default=django.utils.timezone.now, help_text='Marca de tiempo del dato')),
            ],
            options={
                'verbose_name': 'Dato Meteorológico',
                'verbose_name_plural': 'Datos Meteorológicos',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='weatherdata',
            index=models.Index(fields=['city', '-timestamp'], name='weather_wea_city_timestamp_idx'),
        ),
    ]
