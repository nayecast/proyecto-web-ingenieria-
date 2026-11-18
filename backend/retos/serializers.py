from django.utils import timezone
from rest_framework import serializers

from .models import Avance, Reto, TareaSemanal


class AvanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avance
        fields = ['id', 'reto', 'fecha', 'descripcion', 'porcentaje', 'creado']
        read_only_fields = ['creado']


class RetoSerializer(serializers.ModelSerializer):
    total_avances = serializers.IntegerField(source='avances.count', read_only=True)

    class Meta:
        model = Reto
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin',
            'estado', 'total_avances', 'creado', 'actualizado',
        ]
        read_only_fields = ['creado', 'actualizado']

    def validate(self, datos):
        inicio = datos.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fin = datos.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
        if inicio and fin and fin < inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'}
            )
        return datos


class TareaSemanalSerializer(serializers.ModelSerializer):
    reto_titulo = serializers.CharField(source='reto.titulo', read_only=True)

    class Meta:
        model = TareaSemanal
        fields = [
            'id', 'reto', 'reto_titulo', 'semana', 'fecha_inicio', 'fecha_fin',
            'descripcion', 'porcentaje', 'actualizado',
        ]
        read_only_fields = ['reto', 'semana', 'fecha_inicio', 'fecha_fin', 'actualizado']

    def validate(self, datos):
        tarea = self.instance
        hoy = timezone.localdate()
        if tarea is not None:
            if hoy > tarea.fecha_fin:
                raise serializers.ValidationError(
                    f'La semana {tarea.semana} ya está cerrada; no se puede modificar.'
                )
            if hoy < tarea.fecha_inicio:
                raise serializers.ValidationError(
                    f'La semana {tarea.semana} todavía no ha comenzado.'
                )
        return datos
