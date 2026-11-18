# Informe de práctica del backend

El backend Django de Seguimiento de Retos se guardó en el commit `0c9dc5c`. La aplicación se conecta a MySQL 8.4 en el puerto `3309`.

| Verificación | Resultado |
| --- | --- |
| `manage.py check --database default` | Sin problemas |
| Administrador | El reto «Leer 10 libros» muestra el avance «Primer libro» |
| Swagger y API | El esquema OpenAPI se validó y `GET /api/retos/` devolvió HTTP 200 |
| Android | El emulador recibió HTTP 200 y el reto de ejemplo desde `10.0.2.2:8000` |
| `manage.py test retos` | Tres pruebas aprobadas en `test_seguimiento_retos` |

## Dificultades y resolución

- XAMPP escucha en el puerto 3306. El servicio MySQL 8.4 que usa Django escucha en el 3309, que se configuró en `.env`.
- MySQL devolvió 1045 hasta que se guardó la credencial correcta del usuario de la aplicación en el `.env` del proyecto.
- MySQL devolvió 1044 al crear la base de pruebas. Se concedieron permisos sobre `test_seguimiento_retos` desde la consola de MySQL y se repitieron las pruebas.

## Preguntas de reflexión

1. `.env` permite cambiar las credenciales según el equipo sin editar el código. Git ignora el archivo local.
2. `makemigrations` genera archivos con los cambios de los modelos. `migrate` aplica esos archivos a la base de datos.
3. Dentro del emulador, `127.0.0.1` apunta al propio dispositivo virtual. `10.0.2.2` conecta con la máquina anfitriona.
4. El modelo `Avance` define validadores de rango para el porcentaje y el serializador los reutiliza. `RetoSerializer.validate` compara ambas fechas y usa los valores existentes si la actualización parcial omite una de ellas.