"""Calendario del periodo y creación de tareas semanales."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import TareaSemanal


def rango_semana(numero):
    """Devuelve (lunes, domingo) de la semana indicada."""
    inicio = settings.SEMESTRE_INICIO + timedelta(weeks=numero - 1)
    return inicio, inicio + timedelta(days=6)


def semana_actual(hoy=None):
    """Número de semana del periodo que corresponde a hoy."""
    hoy = hoy or timezone.localdate()
    return (hoy - settings.SEMESTRE_INICIO).days // 7 + 1


def crear_tareas_semanales(reto):
    """Crea las tareas que falten desde la semana actual hasta SEMANA_HASTA.

    Devuelve cuántas tareas se crearon.
    """
    existentes = set(reto.tareas.values_list('semana', flat=True))
    desde = max(settings.SEMANA_DESDE, semana_actual())
    nuevas = []
    for numero in range(desde, settings.SEMANA_HASTA + 1):
        if numero in existentes:
            continue
        inicio, fin = rango_semana(numero)
        nuevas.append(TareaSemanal(
            reto=reto,
            semana=numero,
            fecha_inicio=inicio,
            fecha_fin=fin,
            descripcion=f'Meta de la semana {numero}',
        ))
    TareaSemanal.objects.bulk_create(nuevas)
    return len(nuevas)
