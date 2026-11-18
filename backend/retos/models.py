from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Reto(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_CURSO = 'EN_CURSO', 'En curso'
        COMPLETADO = 'COMPLETADO', 'Completado'

    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.PENDIENTE
    )
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_inicio', 'titulo']
        verbose_name = 'reto'
        verbose_name_plural = 'retos'

    def __str__(self):
        return self.titulo


class Avance(models.Model):
    reto = models.ForeignKey(Reto, on_delete=models.CASCADE, related_name='avances')
    fecha = models.DateField()
    descripcion = models.CharField(max_length=255)
    porcentaje = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'avance'
        verbose_name_plural = 'avances'

    def __str__(self):
        return f'{self.reto} - {self.fecha} ({self.porcentaje} %)'


class TareaSemanal(models.Model):
    reto = models.ForeignKey(Reto, on_delete=models.CASCADE, related_name='tareas')
    semana = models.PositiveSmallIntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    descripcion = models.CharField(max_length=255, blank=True)
    porcentaje = models.PositiveSmallIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['reto', 'semana']
        verbose_name = 'tarea semanal'
        verbose_name_plural = 'tareas semanales'
        constraints = [
            models.UniqueConstraint(
                fields=['reto', 'semana'], name='tarea_unica_por_reto_y_semana'
            )
        ]

    def __str__(self):
        return f'{self.reto} - semana {self.semana}'
