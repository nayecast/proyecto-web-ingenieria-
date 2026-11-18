# Práctica: backend Django paso a paso

Fecha de revisión: 17 de noviembre de 2026. Plataforma: Windows 10/11 de 64 bits y PowerShell.

## Propósito y entrega

Al terminar tendrás un backend **Django 5.2 + Django REST Framework** conectado a **MySQL 8.4**, con un panel de administración, una API REST documentada con Swagger y pruebas automáticas. El backend quedará listo para que el frontend Angular/Ionic y la app Android lo consuman.

Trabaja en orden. Ejecuta los bloques uno por uno y comprueba el **resultado esperado** antes de continuar. Si un comando falla, revisa la sección [13. Errores frecuentes](#13-errores-frecuentes) antes de repetirlo.

Entrega las evidencias indicadas en cada sección. No incluyas contraseñas, `SECRET_KEY` ni el contenido de `.env`.

**Esta guía sirve para cualquier proyecto con la misma arquitectura.** Usa como ejemplo *Seguimiento de Retos*. Para otro proyecto, sigue los mismos pasos cambiando los valores de la tabla siguiente; la sección [14. Adaptar la guía a otro proyecto](#14-adaptar-la-guía-a-otro-proyecto) indica exactamente qué cambiar.

## 0. Antes de empezar

### 0.1. Valores del proyecto

| Concepto | Valor en este proyecto | Dónde se usa |
| --- | --- | --- |
| Carpeta raíz | `%USERPROFILE%\proyectos\SeguimientoRetos` | Todos los `Set-Location` |
| Base de datos MySQL | `seguimiento_retos` | `.env`, permisos de pruebas |
| Usuario MySQL de la aplicación | `retos_app` (creado en `'retos_app'@'127.0.0.1'`) | `.env`, permisos de pruebas |
| Puerto MySQL | `3307` (comprueba el tuyo en el apartado 6.1, paso C) | `.env` y comandos `mysql -P` |
| Proyecto Django (configuración) | `config` | Igual en todos los proyectos |
| Aplicación Django | `retos` | `startapp`, `INSTALLED_APPS`, `urls.py` |
| Modelos de ejemplo | `Reto` y `Avance` | `models.py`, API, pruebas |

Si al instalar MySQL se eligió otro puerto, usa ese número en `DB_PORT` y en cada comando que contenga `3307`.

El proyecto Django se llama siempre `config`: así la carpeta de configuración (`settings.py`, `urls.py`) se reconoce igual en cualquier proyecto. Lo que cambia entre proyectos es la **aplicación** (`retos`) y sus modelos.

### 0.2. Requisitos

Debes tener completada la guía `02-instalacion-windows.md`, como mínimo:

- Sección 1: MySQL 8.4 en el puerto 3307, la base `seguimiento_retos` y el usuario `retos_app`.
- Secciones 4 y 5: carpeta `backend`, entorno virtual `backend\.venv` y dependencias (Django 5.2, DRF, django-filter, drf-spectacular, django-cors-headers, python-dotenv, mysqlclient).
- Apartado 5.3: `.gitignore` en la raíz.

### 0.3. Estructura final

```text
SeguimientoRetos/
├── .gitignore
├── backend/
│   ├── .venv/                 (no se sube a Git)
│   ├── .env                   (no se sube a Git)
│   ├── .env.example
│   ├── requirements.txt
│   ├── manage.py              ← apartado 3
│   ├── config/                ← apartado 3: configuración del proyecto
│   │   ├── settings.py
│   │   └── urls.py
│   └── retos/                 ← apartado 4: aplicación
│       ├── models.py
│       ├── admin.py
│       ├── serializers.py     (nuevo)
│       ├── views.py
│       ├── urls.py            (nuevo)
│       └── tests.py
└── frontend/
```

## 1. Abrir la terminal y activar el entorno virtual

En VS Code abre la carpeta raíz `SeguimientoRetos` y una terminal PowerShell (`Ctrl+Shift+ñ`).

```powershell
Set-Location "$env:USERPROFILE\proyectos\SeguimientoRetos\backend"
.\.venv\Scripts\Activate.ps1
python -c "import sys; from pathlib import Path; assert Path(sys.prefix).resolve() == Path('.venv').resolve(), 'Activa backend/.venv'; assert sys.version_info[:2] == (3, 12), 'Se requiere Python 3.12'; print('OK: Python 3.12 del entorno virtual')"
python -m django --version
Get-Service MySQL84
```

Resultado esperado: el indicador `(.venv)` al inicio de la línea, `OK: Python 3.12 del entorno virtual`, Django `5.2.x` y el servicio `MySQL84` en estado `Running`.

Si PowerShell bloquea `Activate.ps1`, permite scripts solo para esta sesión y repite la activación:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

**A partir de aquí, todos los comandos `python` se ejecutan desde `backend` con `(.venv)` activo**, salvo que el bloque indique otra carpeta. Si abres una terminal nueva, repite este apartado.

## 2. Preparar las variables de entorno (`.env`)

Las contraseñas y la clave secreta no se escriben en el código: Django las leerá de `backend\.env` mediante `python-dotenv`.

### 2.1. Generar la clave secreta

```powershell
Test-Path .\.env
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copia la clave que aparece; la usarás en el apartado 2.2.

`Test-Path` indica si `backend\.env` ya existe:

- `False`: el archivo no existe. Es lo normal si no lo creaste en la guía 02. Créalo en el apartado 2.2.
- `True`: el archivo ya existe. Ábrelo en el apartado 2.2 y complétalo para que tenga todas las variables indicadas.

### 2.2. Crear o completar `backend\.env`

Si `Test-Path` mostró `False`, crea el archivo en VS Code:

1. En el **Explorador** de VS Code (panel izquierdo), haz clic derecho sobre la carpeta `backend`.
2. Elige **Nuevo archivo** y escribe exactamente `.env` (con el punto y sin extensión). Pulsa Enter.
3. Comprueba que el archivo aparece **dentro de `backend`**, al mismo nivel que `requirements.txt` y `.venv`. No debe quedar en la raíz `SeguimientoRetos` ni **dentro de la carpeta `.venv`**.

Error habitual: si la carpeta `.venv` estaba seleccionada o desplegada en el Explorador, VS Code crea el archivo dentro de ella (`backend\.venv\.env`). Para evitarlo, contrae `.venv` y haz clic derecho exactamente sobre el nombre `backend`. Al pasar el ratón sobre la pestaña del archivo abierto, VS Code muestra su ruta completa: debe terminar en `backend\.env`.

Si mostró `True`, abre `backend\.env` desde el Explorador.

Comprueba la ubicación desde `backend`:

```powershell
Test-Path .\.env
Test-Path .\.venv\.env
```

Resultado esperado: `True` y después `False`. Si obtienes `False` y `True`, el archivo quedó dentro de `.venv`; muévelo a `backend` y repite la comprobación:

```powershell
Move-Item .\.venv\.env .\.env
Test-Path .\.env
```

Pega estas variables, sustituye los dos valores `REEMPLAZAR` y guarda con `Ctrl+S`:

```dotenv
DB_NAME=seguimiento_retos
DB_USER=retos_app
DB_PASSWORD='REEMPLAZAR_POR_TU_CLAVE_DE_MYSQL'
DB_HOST=127.0.0.1
DB_PORT=3307
SECRET_KEY='REEMPLAZAR_POR_LA_CLAVE_GENERADA'
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2
CORS_ALLOWED_ORIGINS=http://localhost:8100,http://localhost:4200,https://localhost
```

- `DB_PASSWORD` es la contraseña del usuario `retos_app` que definiste en la guía 02 (apartado 1.3), no la de `root`.
- `SECRET_KEY` es la clave que generaste en el apartado 2.1.
- Escribe la contraseña y la clave **entre comillas simples**, para conservar caracteres como `#` o `$`. Ejemplo: `SECRET_KEY='k#3x$...'`.
- `DB_HOST` debe ser `127.0.0.1`, no `localhost`: el usuario se creó como `'retos_app'@'127.0.0.1'` y con `localhost` MySQL rechaza el acceso.
- `ALLOWED_HOSTS` incluye `10.0.2.2`, la dirección con la que el emulador Android llega a tu PC.
- `CORS_ALLOWED_ORIGINS` contiene los orígenes del frontend: `ionic serve` (8100), `ng serve` (4200) y la app Capacitor en Android (`https://localhost`).

Crea el archivo desde VS Code y no con `Set-Content` de Windows PowerShell 5.1: ese comando puede añadir una marca BOM al inicio y entonces la primera variable no se lee.

### 2.3. Comprobar el archivo sin mostrar secretos

```powershell
python -c "from dotenv import dotenv_values; v = dotenv_values('.env'); faltan = [k for k in ['DB_NAME','DB_USER','DB_PASSWORD','DB_HOST','DB_PORT','SECRET_KEY','DEBUG','ALLOWED_HOSTS','CORS_ALLOWED_ORIGINS'] if not v.get(k)]; print('Faltan:', faltan) if faltan else print('OK: .env completo')"
git check-ignore .env
```

Resultado esperado: `OK: .env completo` y `.env` (Git lo ignora). Si `git check-ignore` no muestra nada, revisa el `.gitignore` de la raíz (guía 02, apartado 5.3) antes de continuar.

### 2.4. Crear `backend\.env.example`

En VS Code crea `backend\.env.example` con los **nombres** de las variables y valores de ejemplo, sin credenciales reales. Este archivo sí se sube a Git para que otro integrante sepa qué variables necesita:

```dotenv
DB_NAME=seguimiento_retos
DB_USER=retos_app
DB_PASSWORD='cambia_esta_clave'
DB_HOST=127.0.0.1
DB_PORT=3307
SECRET_KEY='genera_una_con_get_random_secret_key'
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,10.0.2.2
CORS_ALLOWED_ORIGINS=http://localhost:8100,http://localhost:4200,https://localhost
```

## 3. Crear el proyecto Django

Desde `backend` con `(.venv)` activo:

```powershell
if (Test-Path .\manage.py) {
    'manage.py ya existe: el proyecto ya se creó, continúa con el apartado 4.'
} else {
    python -m django startproject config .
}
Get-ChildItem -Name
```

**El punto final es obligatorio**: crea `manage.py` directamente en `backend`. Sin el punto se crearía una carpeta `config\config` adicional.

Resultado esperado: aparecen `manage.py` y la carpeta `config`, junto a `.venv`, `.env`, `.env.example` y `requirements.txt`.

`startproject` se ejecuta **una sola vez**; el bloque anterior lo omite si ya existe `manage.py`. Si ejecutas `python -m django startproject config .` directamente por segunda vez, aparece `CommandError: 'config' conflicts with the name of an existing Python module`: la carpeta `config` ya existe porque el proyecto ya se creó. No cambies el nombre ni borres nada; continúa con el apartado 4.

## 4. Crear la aplicación

Desde `backend`:

```powershell
if (Test-Path .\retos\apps.py) {
    'La aplicación retos ya existe: continúa con el apartado 5.'
} else {
    python manage.py startapp retos
}
Get-ChildItem retos -Name
```

Resultado esperado: la carpeta `retos` con `admin.py`, `apps.py`, `models.py`, `tests.py`, `views.py` y la carpeta `migrations`.

Un proyecto Django puede tener varias aplicaciones; cada una agrupa modelos y vistas de un mismo tema. `startapp` también se ejecuta una sola vez por aplicación; el bloque anterior lo omite si la aplicación ya existe.

## 5. Configurar `config\settings.py`

Abre `backend\config\settings.py`, **borra todo su contenido** y pega el siguiente. Reemplazar el archivo completo evita errores al editar partes sueltas:

```python
"""Configuración de Django. Los valores sensibles se leen de backend/.env."""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def variable(nombre, por_defecto=None):
    """Devuelve una variable de .env o detiene Django con un mensaje claro."""
    valor = os.getenv(nombre, por_defecto)
    if valor is None or valor == '':
        raise ImproperlyConfigured(f'Falta la variable {nombre} en backend/.env')
    return valor


def lista(nombre, por_defecto=''):
    """Convierte 'a,b,c' en ['a', 'b', 'c']."""
    return [x.strip() for x in os.getenv(nombre, por_defecto).split(',') if x.strip()]


# --- Seguridad ---------------------------------------------------------------
SECRET_KEY = variable('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = lista('ALLOWED_HOSTS', 'localhost,127.0.0.1')

# --- Aplicaciones -----------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'django_filters',
    'drf_spectacular',
    'corsheaders',
    # Propias
    'retos',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # antes de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Base de datos MySQL ----------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': variable('DB_NAME'),
        'USER': variable('DB_USER'),
        'PASSWORD': variable('DB_PASSWORD'),
        'HOST': variable('DB_HOST', '127.0.0.1'),
        'PORT': variable('DB_PORT', '3309'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'TEST': {
            'NAME': f"test_{variable('DB_NAME')}",
            'CHARSET': 'utf8mb4',
            'COLLATION': 'utf8mb4_unicode_ci',
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Idioma y zona horaria --------------------------------------------------
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework y documentación ----------------------------------
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'API Seguimiento de Retos',
    'DESCRIPTION': 'Backend Django REST del proyecto Seguimiento de Retos.',
    'VERSION': '1.0.0',
}

# --- CORS: orígenes del frontend que pueden llamar a la API -----------------
CORS_ALLOWED_ORIGINS = lista('CORS_ALLOWED_ORIGINS', 'http://localhost:8100')
```

Guarda el archivo (`Ctrl+S`).

Qué hace cada bloque:

- `load_dotenv` lee `backend\.env`; la función `variable` detiene Django con un mensaje claro si falta un valor.
- `INSTALLED_APPS` registra DRF, los filtros, la documentación, CORS y la aplicación `retos`.
- `DATABASES` usa MySQL con `utf8mb4` (admite tildes, ñ y emojis) y modo estricto, que rechaza datos inválidos en lugar de recortarlos.
- `TEST` define la base temporal que Django crea al ejecutar pruebas (apartado 11).
- `REST_FRAMEWORK` activa filtros, búsqueda, ordenación y paginación de 20 elementos en todas las listas.

En esta práctica la API no exige inicio de sesión, para centrarnos en su construcción. La autenticación se añadirá en una etapa posterior; no publiques este backend en Internet.

## 6. Conectar con MySQL y crear las tablas base

### 6.1. Verificar configuración y conexión

```powershell
python manage.py check
python manage.py check --database default
```

Resultado esperado en ambos: `System check identified no issues (0 silenced).`

El segundo comando se conecta realmente a MySQL. Si falla, el mensaje indica la causa (contraseña, puerto, base inexistente): revisa la sección 13 antes de seguir.

#### Si aparece `(2002, "Can't connect to server on '127.0.0.1' (10061)")` o `(2003, ...)`

El código `10061` significa **conexión rechazada**: Django llegó a la PC, pero ningún servidor MySQL respondió en el puerto indicado en `.env`. La contraseña todavía no interviene. Si además `Test-NetConnection 127.0.0.1 -Port 3307` muestra `TcpTestSucceeded : False`, el problema está en MySQL, no en Django.

Sigue estos pasos **en orden** y detente en el primero que resuelva el problema.

**Paso A. ¿Está iniciado el servicio MySQL?**

```powershell
Get-Service *mysql* | Select-Object Name, Status, StartType
```

- `Status` = `Running`: el servicio está iniciado; pasa al paso C.
- Si aparecen varios servicios (por ejemplo `MySQL84` y otro `MySQL` antiguo), el que usa esta práctica es `MySQL84`.
- `Status` = `Stopped`: el servicio está detenido; haz el paso B.
- No aparece ningún servicio: MySQL no está instalado como servicio; repite la guía 02, apartado 1.2.

Anota el nombre real del servicio (`Name`); normalmente es `MySQL84`.

**Paso B. Iniciar el servicio (solo si estaba `Stopped`)**

Iniciar un servicio requiere permisos de administrador. Abre el menú Inicio, busca **PowerShell**, elige **Ejecutar como administrador** y ejecuta (cambia `MySQL84` si tu servicio tiene otro nombre):

```powershell
Start-Service MySQL84
Set-Service MySQL84 -StartupType Automatic
Get-Service MySQL84
```

Resultado esperado: `Running`. `Set-Service ... Automatic` hace que MySQL arranque solo al encender la PC, para que el error no se repita. Cierra esa ventana de administrador y vuelve a la terminal de VS Code.

Si aparece `Cannot open 'MySQL84' service on computer '.'` (o `No se puede abrir el servicio`), la terminal **no** tiene permisos de administrador. La terminal de VS Code normalmente no los tiene: abre una ventana aparte con **Ejecutar como administrador** (el título de la ventana empieza por `Administrador:`) y repite el bloque. Si tu cuenta no tiene permisos de administrador, pide al docente o al técnico del laboratorio que inicie el servicio.

Alternativa sin comandos: tecla Windows → **Servicios** → busca `MySQL84` → clic derecho → **Iniciar**; en **Propiedades** pon **Tipo de inicio: Automático**.

Si el servicio no inicia o se detiene enseguida, revisa el final del registro de errores de MySQL:

```powershell
Get-ChildItem 'C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err' | ForEach-Object { Get-Content $_ -Tail 20 }
```

Copia esas líneas y consúltalas con el docente.

**Paso C. ¿En qué puerto escucha MySQL?**

Desde la terminal de VS Code, en `backend`:

```powershell
Get-Process mysqld | Select-Object Id, Path
Get-NetTCPConnection -State Listen -OwningProcess (Get-Process mysqld).Id | Select-Object LocalAddress, LocalPort, OwningProcess
Select-String -Path .\.env -Pattern '^DB_HOST|^DB_PORT'
```

- El primero muestra **qué MySQL** está en ejecución. `Path` debe contener `MySQL Server 8.4`. Si contiene `xampp` u otra carpeta, es otro servidor (por ejemplo, el MariaDB de XAMPP), que no tiene la base `seguimiento_retos` ni el usuario `retos_app`: no lo uses. Detenlo desde su panel e inicia `MySQL84` (paso B).
- El segundo muestra los puertos de cada proceso (`LocalPort`). El principal es `3307` en esta práctica; `33060` es otro protocolo de MySQL y no se usa en Django. `LocalAddress` puede ser `::` o `0.0.0.0`: ambos significan que MySQL acepta conexiones locales, incluida `127.0.0.1`.
- El tercero muestra lo que tiene `.env`.

Para confirmar el puerto configurado en MySQL 8.4, consulta su archivo de configuración:

```powershell
Select-String -Path 'C:\ProgramData\MySQL\MySQL Server 8.4\my.ini' -Pattern '^port'
```

| Resultado | Solución |
| --- | --- |
| `LocalPort` es `3307` y `DB_PORT=3307` | Puerto correcto; pasa al paso D |
| `LocalPort` es otro (por ejemplo `3306` o `3309`) | MySQL se configuró con otro puerto durante la instalación. Pon ese número en `DB_PORT` del `.env` y guarda. Desde ahora usa **ese puerto** en todos los comandos de esta guía que llevan `-P 3307` o `-Port 3307` (apartados 7.3 y 11.1) |
| `DB_HOST` no es `127.0.0.1` | Corrige `DB_HOST=127.0.0.1` y guarda |
| `Get-Process mysqld` da error | MySQL no está en ejecución: vuelve al paso A |

**Paso D. Comprobar y repetir**

Usa en `-Port` el mismo número que tiene `DB_PORT`:

```powershell
Test-NetConnection 127.0.0.1 -Port 3309 | Select-Object TcpTestSucceeded
python manage.py check --database default
```

Resultado esperado: `TcpTestSucceeded : True` y `System check identified no issues (0 silenced).`

### 6.2. Aplicar las migraciones iniciales

Django incluye tablas propias (usuarios, permisos, sesiones). Las migraciones las crean en MySQL:

```powershell
python manage.py migrate
python manage.py showmigrations
```

Resultado esperado: una lista de `Applying ... OK` y, en `showmigrations`, todas las migraciones de `admin`, `auth`, `contenttypes` y `sessions` marcadas con `[X]`.

Debajo de `retos` aparece `(no migrations)`: **es correcto en este punto**. La aplicación todavía no tiene modelos; su migración `0001_initial` se crea en el apartado 7.2 y desde entonces aparecerá como `[X] 0001_initial`.

### 6.3. Crear el superusuario

```powershell
python manage.py createsuperuser
```

Introduce un nombre de usuario, un correo (puede quedar vacío) y una contraseña. La contraseña no se muestra mientras escribes; es normal. Si avisa de que es demasiado común o corta, puedes elegir otra.

### 6.4. Iniciar el servidor y entrar al administrador

```powershell
python manage.py runserver
```

Abre `http://127.0.0.1:8000/admin/` e inicia sesión con el superusuario. Debe verse el panel de administración en español con **Usuarios** y **Grupos**.

El servidor ocupa esta terminal mientras está en ejecución. Detenlo con `Ctrl+C` antes de seguir con el apartado 7. Si visitas `http://127.0.0.1:8000/` verás una página 404: todavía no hay rutas en la raíz y es lo esperado.

#### Si el administrador no acepta el usuario o la clave

El mensaje `Por favor introduzca el nombre de usuario y la clave correctos para una cuenta de personal` aparece cuando el usuario no existe, la clave no coincide o el usuario no es de personal. Usuario y clave distinguen mayúsculas y minúsculas.

Deja el servidor en ejecución y abre una **segunda terminal** en `backend` con `(.venv)` activo (apartado 1). Primero mira qué usuarios existen:

```powershell
python manage.py shell -c "from django.contrib.auth import get_user_model; [print(u.username, '| personal:', u.is_staff, '| superusuario:', u.is_superuser) for u in get_user_model().objects.all()]"
```

| Resultado | Solución |
| --- | --- |
| No aparece ningún usuario | `createsuperuser` no terminó. Repite el apartado 6.3 |
| Aparece tu usuario con `personal: True` | La clave no coincide: cámbiala con el comando siguiente |
| Aparece tu usuario con `personal: False` | No es superusuario: crea uno nuevo con el apartado 6.3 |

Para cambiar la clave de un usuario existente (sustituye `admin` por el nombre que apareció):

```powershell
python manage.py changepassword admin
```

Escribe la clave nueva dos veces; no se muestra mientras escribes. Resultado esperado: `Password changed successfully for user 'admin'`. Vuelve a `http://127.0.0.1:8000/admin/` e inicia sesión con el **nombre de usuario** (no el correo) y la clave nueva.

**Evidencia 1:** salida de `check --database default` sin errores y panel de administración abierto.

## 7. Crear los modelos

Un modelo es una clase Python que Django convierte en una tabla MySQL. En este proyecto, un **Reto** es un objetivo con fechas y estado, y un **Avance** registra el progreso de un reto.

### 7.1. Escribir `retos\models.py`

Reemplaza todo el contenido de `backend\retos\models.py` por:

```python
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
```

- `TextChoices` limita `estado` a tres valores válidos.
- `ForeignKey` relaciona cada avance con su reto; `on_delete=models.CASCADE` borra los avances si se borra el reto, y `related_name='avances'` permite escribir `reto.avances.all()`.
- `auto_now_add` y `auto_now` guardan automáticamente las fechas de creación y modificación.

### 7.2. Generar y aplicar la migración

```powershell
python manage.py makemigrations retos
python manage.py sqlmigrate retos 0001
python manage.py migrate
```

Resultado esperado:

- `makemigrations` crea `retos\migrations\0001_initial.py` con `Create model Reto` y `Create model Avance`.
- `sqlmigrate` muestra el SQL `CREATE TABLE` que Django ejecutará en MySQL (solo lo muestra, no lo ejecuta).
- `migrate` termina con `Applying retos.0001_initial... OK`.

Cada vez que cambies `models.py`, repite `makemigrations` y `migrate`. Las migraciones se suben a Git: no las borres.

### 7.3. Comprobar las tablas en MySQL

```powershell
$env:Path = "C:\Program Files\MySQL\MySQL Server 8.4\bin;" + $env:Path
mysql -h 127.0.0.1 -P 3309 -u retos_app -p seguimiento_retos -e "SHOW TABLES; DESCRIBE retos_reto;"
```

Resultado esperado: entre las tablas aparecen `retos_reto` y `retos_avance`, además de las tablas `auth_*` y `django_*`. Django nombra las tablas como `aplicación_modelo`.

## 8. Registrar los modelos en el administrador

Reemplaza todo el contenido de `backend\retos\admin.py` por:

```python
from django.contrib import admin

from .models import Avance, Reto


class AvanceInline(admin.TabularInline):
    model = Avance
    extra = 0


@admin.register(Reto)
class RetoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado', 'fecha_inicio', 'fecha_fin')
    list_filter = ('estado',)
    search_fields = ('titulo', 'descripcion')
    inlines = [AvanceInline]


@admin.register(Avance)
class AvanceAdmin(admin.ModelAdmin):
    list_display = ('reto', 'fecha', 'porcentaje')
    list_filter = ('reto',)
```

Inicia el servidor y comprueba:

```powershell
python manage.py runserver
```

En `http://127.0.0.1:8000/admin/` aparece la sección **Retos** con **Retos** y **Avances**. Crea un reto y, dentro de él, agrega un avance desde la tabla inferior. Prueba a guardar un avance con porcentaje `150`: el administrador debe rechazarlo. Detén el servidor con `Ctrl+C`.

**Evidencia 2:** un reto con al menos un avance en el administrador.

## 9. Construir la API REST

La API expone los modelos como JSON para que Angular y la app Android los consuman. Se construye en tres piezas: **serializador** (modelo ↔ JSON y validaciones), **vista** (qué operaciones se permiten) y **rutas** (en qué URL).

### 9.1. Serializadores: `retos\serializers.py`

Crea el archivo nuevo `backend\retos\serializers.py`:

```python
from rest_framework import serializers

from .models import Avance, Reto


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
```

`validate` comprueba una regla que relaciona dos campos. Las validaciones de cada campo (por ejemplo, porcentaje entre 0 y 100) se toman automáticamente del modelo.

### 9.2. Vistas: `retos\views.py`

Reemplaza todo el contenido de `backend\retos\views.py` por:

```python
from rest_framework import viewsets

from .models import Avance, Reto
from .serializers import AvanceSerializer, RetoSerializer


class RetoViewSet(viewsets.ModelViewSet):
    """Listar, crear, consultar, modificar y eliminar retos."""

    queryset = Reto.objects.all()
    serializer_class = RetoSerializer
    filterset_fields = ['estado']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'titulo', 'estado']


class AvanceViewSet(viewsets.ModelViewSet):
    """Listar, crear, consultar, modificar y eliminar avances."""

    queryset = Avance.objects.select_related('reto')
    serializer_class = AvanceSerializer
    filterset_fields = ['reto']
    ordering_fields = ['fecha', 'porcentaje']
```

Un `ModelViewSet` ofrece las cinco operaciones CRUD con muy poco código.

### 9.3. Rutas de la aplicación: `retos\urls.py`

Crea el archivo nuevo `backend\retos\urls.py`:

```python
from rest_framework.routers import DefaultRouter

from .views import AvanceViewSet, RetoViewSet

router = DefaultRouter()
router.register('retos', RetoViewSet)
router.register('avances', AvanceViewSet)

urlpatterns = router.urls
```

### 9.4. Rutas del proyecto: `config\urls.py`

Reemplaza todo el contenido de `backend\config\urls.py` por:

```python
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    path('api/', include('retos.urls')),
]
```

### 9.5. Verificar

```powershell
python manage.py check
python manage.py spectacular --file NUL --validate
```

Resultado esperado: `System check identified no issues` y el segundo comando sin errores (genera la documentación OpenAPI y la descarta; solo sirve para validarla). Si muestra advertencias `Warning`, léelas: no detienen la API, pero indican campos que la documentación no pudo describir.

Rutas que quedan disponibles:

| Método | URL | Acción |
| --- | --- | --- |
| GET | `/api/` | Índice de la API |
| GET / POST | `/api/retos/` | Listar / crear retos |
| GET / PUT / PATCH / DELETE | `/api/retos/{id}/` | Consultar / modificar / eliminar un reto |
| GET / POST | `/api/avances/` | Listar / crear avances |
| GET / PUT / PATCH / DELETE | `/api/avances/{id}/` | Consultar / modificar / eliminar un avance |
| GET | `/api/docs/` | Documentación Swagger |
| GET | `/api/schema/` | Esquema OpenAPI (para herramientas) |

## 10. Probar la API

### 10.1. Desde el navegador

En la terminal 1, desde `backend` con `(.venv)`:

```powershell
python manage.py runserver
```

Deja este servidor en ejecución y abre:

1. `http://127.0.0.1:8000/api/`: índice navegable de DRF con los enlaces `retos` y `avances`.
2. `http://127.0.0.1:8000/api/retos/`: lista paginada (`count`, `next`, `previous`, `results`). Al final de la página hay un formulario para crear un reto con **POST**.
3. `http://127.0.0.1:8000/api/docs/`: documentación Swagger. Despliega `POST /api/retos/`, pulsa **Try it out**, edita el JSON y pulsa **Execute**. Swagger descarga sus estilos de Internet: sin conexión, la página puede quedar en blanco.

Prueba los filtros en el navegador:

- `http://127.0.0.1:8000/api/retos/?estado=PENDIENTE`
- `http://127.0.0.1:8000/api/retos/?search=libros`
- `http://127.0.0.1:8000/api/retos/?ordering=titulo`
- `http://127.0.0.1:8000/api/avances/?reto=1`

### 10.2. Desde PowerShell

Abre una **segunda terminal** (el servidor sigue en la primera). No hace falta activar `.venv` para estas pruebas:

```powershell
$reto = @{ titulo = 'Leer 10 libros'; descripcion = 'Un libro por semana'; fecha_inicio = '2026-11-18'; estado = 'EN_CURSO' } | ConvertTo-Json
$creado = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/retos/' -ContentType 'application/json' -Body $reto
$creado

$avance = @{ reto = $creado.id; fecha = '2026-11-18'; descripcion = 'Primer libro iniciado'; porcentaje = 10 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/avances/' -ContentType 'application/json' -Body $avance

(Invoke-RestMethod 'http://127.0.0.1:8000/api/retos/').results | Format-Table id, titulo, estado, total_avances
```

Resultado esperado: el reto creado con su `id`, el avance creado y una tabla en la que el reto muestra `total_avances` igual a `1`.

Comprueba que la validación funciona; esta petición **debe fallar** con `400 (Bad Request)`:

```powershell
$malo = @{ titulo = 'Fechas al reves'; fecha_inicio = '2026-11-18'; fecha_fin = '2026-11-01' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/retos/' -ContentType 'application/json' -Body $malo
```

Resultado esperado: PowerShell muestra un error en rojo con este contenido:

```text
Invoke-RestMethod:
{
  "fecha_fin": [
    "La fecha de fin no puede ser anterior a la fecha de inicio."
  ]
}
```

**Ese error es el resultado correcto.** La API rechazó el dato inválido con `400 Bad Request` y devolvió el mensaje del método `validate` del serializador (apartado 9.1); el reto no se guardó. `Invoke-RestMethod` siempre muestra en rojo las respuestas 4xx. En Windows PowerShell 5.1 el texto puede ser `El servidor remoto devolvió un error: (400) Solicitud incorrecta`, sin el JSON; el resultado es igualmente correcto.

En estos ejemplos se evitan tildes y ñ: Windows PowerShell 5.1 puede enviarlas mal codificadas. Desde el navegador, Swagger o el frontend se envían correctamente.

### 10.3. Desde el emulador Android

El emulador no puede usar `127.0.0.1` para llegar a tu PC: debe usar `10.0.2.2`. Detén el servidor de la terminal 1 con `Ctrl+C` e inícialo escuchando en todas las interfaces:

```powershell
python manage.py runserver 0.0.0.0:8000
```

Resultado esperado:

```text
System check identified no issues (0 silenced).
Django version 5.2.x, using settings 'config.settings'
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.

WARNING: This is a development server. Do not use it in a production setting. ...
```

- El `WARNING` es un recordatorio normal: `runserver` es solo para desarrollo. No es un error.
- `0.0.0.0` significa "escuchar en todas las interfaces de red de la PC". No se escribe esa dirección en el navegador: desde la PC sigue siendo `http://127.0.0.1:8000/` y desde el emulador `http://10.0.2.2:8000/`.
- En Windows, Django indica `CTRL-BREAK` para detener el servidor; `Ctrl+C` también funciona.
- La terminal queda ocupada mostrando cada petición. Déjala abierta mientras pruebas.

Si Windows muestra una alerta del Firewall, permite el acceso solo en **redes privadas**.

Ahora prueba **dentro del emulador**:

1. Inicia el emulador con **una** de estas dos formas:

   **Opción A: desde Android Studio**

   1. Abre el **Device Manager**:
      - Con un proyecto abierto (interfaz nueva de Android Studio): en la **barra de iconos del borde derecho** de la ventana, pulsa el icono de un **teléfono con el logo de Android** (al pasar el ratón dice *Device Manager*).
      - Si no ves ese icono: menú ☰ (arriba a la izquierda) > **View > Tool Windows > Device Manager**.
      - Otra forma: pulsa dos veces `Shift`, escribe `Device Manager` y pulsa Enter.
      - En la pantalla de bienvenida (sin proyecto abierto): **More Actions > Virtual Device Manager**.
   2. En el panel **Device Manager** aparece la lista de dispositivos virtuales (por ejemplo, `Medium Phone API 36`). Pulsa el botón ▶ (**Start**) de su fila.
   3. El teléfono aparece en el panel **Running Devices** de Android Studio o en una ventana aparte. El primer arranque puede tardar uno o dos minutos.
   4. Si la lista está vacía, crea un dispositivo con **+ > Create Virtual Device** (guía 02, sección 9, paso 6).

   El aviso `Gradle project sync failed` que puede aparecer arriba no impide iniciar el emulador ni hacer esta prueba; se resuelve configurando **Gradle JDK** en el JDK 21 (guía 02, apartado 9.3).

   **Opción B: desde PowerShell (sin abrir Android Studio)**

   En una terminal nueva (deja `runserver` en la suya):

   ```powershell
   & "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds
   ```

   Muestra los nombres de tus dispositivos virtuales, por ejemplo `Medium_Phone_API_36`. Inicia el que corresponda escribiendo su nombre exacto:

   ```powershell
   & "$env:ANDROID_HOME\emulator\emulator.exe" -avd Medium_Phone_API_36
   ```

   Se abre una ventana con el teléfono. Esa terminal queda ocupada mientras el emulador está encendido. Si `$env:ANDROID_HOME` está vacío, repite el apartado 9.3 de la guía 02.

   Con cualquiera de las dos opciones, espera a ver la **pantalla de inicio de Android** (fondo de pantalla e iconos) antes de seguir. Puedes confirmarlo desde PowerShell con `adb devices`: debe aparecer `emulator-5554   device`.
2. **Dentro de la ventana del teléfono**, abre la app **Chrome** (icono en la pantalla de inicio o deslizando hacia arriba). Si pide iniciar sesión, elige **Usar sin una cuenta**.
3. En la barra de direcciones del Chrome **del teléfono**, escribe `http://10.0.2.2:8000/api/retos/`.

Resultado esperado: la misma lista JSON que ves en la PC, y en la terminal de `runserver` aparece una línea como `"GET /api/retos/ HTTP/1.1" 200`.

**Importante:** `10.0.2.2` solo existe dentro del emulador; es su forma de llegar a la PC. Si escribes `http://10.0.2.2:8000/...` en el navegador de la PC (Chrome, Edge o el navegador de VS Code), la página se queda cargando y termina con `ERR_CONNECTION_TIMED_OUT`. En la PC usa siempre `http://127.0.0.1:8000/`.

#### Si el Chrome del emulador no carga `10.0.2.2:8000`

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `ERR_CONNECTION_TIMED_OUT` y en `runserver` **no** aparece ninguna línea `GET` | El emulador usa un proxy que no llega a la PC (habitual en redes institucionales) | En la barra lateral del emulador pulsa **⋯ (Extended controls) > Settings > Proxy**, elige **No proxy** y pulsa **Apply**. Recarga la página |
| `ERR_CONNECTION_REFUSED` | El servidor no está en ejecución o se inició sin `0.0.0.0` | Revisa la terminal: debe decir `Starting development server at http://0.0.0.0:8000/` |
| Página `DisallowedHost` / `Invalid HTTP_HOST header: '10.0.2.2:8000'` | Falta `10.0.2.2` en `ALLOWED_HOSTS` | Añádelo en `.env` (apartado 2.2) y reinicia `runserver` |
| Funciona en la PC con `127.0.0.1` pero no en un teléfono real | Firewall de Windows o red distinta | Teléfono y PC en la misma Wi-Fi; permite Python en redes privadas en **Firewall de Windows > Permitir una aplicación** |

Para un teléfono real en la misma red Wi-Fi, consulta la IPv4 de la PC con `ipconfig`, añádela a `ALLOWED_HOSTS` en `.env`, reinicia el servidor y visita `http://IP_DE_LA_PC:8000/api/retos/`. No abras el puerto de MySQL: el teléfono solo habla con Django.

La conexión de la app Ionic/Angular con esta API (servicio HTTP, CORS y tráfico HTTP en Android) se realiza en la guía del frontend.

**Evidencia 3:** `/api/docs/` con una operación ejecutada y `/api/retos/` abierto en el emulador.

## 11. Pruebas automáticas

### 11.1. Permitir la base de datos de pruebas

`python manage.py test` crea una base temporal `test_seguimiento_retos` y la borra al terminar. El usuario `retos_app` solo tiene permisos sobre `seguimiento_retos`, así que primero hay que darle permiso sobre la base de pruebas. Entra como `root`:

```powershell
mysql -h 127.0.0.1 -P 3307 -u root -p
```

```sql
GRANT ALL PRIVILEGES ON `test_seguimiento_retos`.* TO 'retos_app'@'127.0.0.1';
SHOW GRANTS FOR 'retos_app'@'127.0.0.1';
EXIT;
```

Resultado esperado: `SHOW GRANTS` muestra permisos sobre `seguimiento_retos` y sobre `test_seguimiento_retos`. Este paso se hace una sola vez.

### 11.2. Escribir `retos\tests.py`

Reemplaza todo el contenido de `backend\retos\tests.py` por:

```python
from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Reto


class RetoApiTests(APITestCase):
    def test_crear_y_listar_reto(self):
        url = reverse('reto-list')
        datos = {'titulo': 'Leer 10 libros', 'fecha_inicio': '2026-11-18'}

        respuesta = self.client.post(url, datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reto.objects.count(), 1)

        respuesta = self.client.get(url)
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['count'], 1)

    def test_rechaza_fecha_fin_anterior_a_inicio(self):
        datos = {'titulo': 'Fechas', 'fecha_inicio': '2026-11-18', 'fecha_fin': '2026-11-01'}
        respuesta = self.client.post(reverse('reto-list'), datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fecha_fin', respuesta.data)

    def test_rechaza_porcentaje_mayor_a_100(self):
        reto = Reto.objects.create(titulo='Correr', fecha_inicio=date(2026, 11, 18))
        datos = {'reto': reto.id, 'fecha': '2026-11-18', 'descripcion': 'Prueba', 'porcentaje': 150}
        respuesta = self.client.post(reverse('avance-list'), datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('porcentaje', respuesta.data)
```

Los nombres `reto-list` y `avance-list` los genera automáticamente el router a partir de los modelos.

### 11.3. Ejecutar las pruebas

```powershell
python manage.py test retos -v 2
```

Resultado esperado: `Creating test database for alias 'default'...`, las tres pruebas con `ok` y al final `Ran 3 tests` y `OK`. Las pruebas usan la base temporal: no modifican los datos de `seguimiento_retos`.

**Evidencia 4:** salida de `python manage.py test retos` con `OK`.

## 12. Guardar el trabajo en Git

Desde la raíz del repositorio:

```powershell
Set-Location "$env:USERPROFILE\proyectos\SeguimientoRetos"
git check-ignore backend/.env backend/.venv/pyvenv.cfg
git add backend
git status --short
```

Resultado esperado:

- `git check-ignore` muestra las dos rutas: `.env` y `.venv` quedan fuera de Git.
- `git status` lista `backend/manage.py`, `backend/config/...`, `backend/retos/...` (incluida `retos/migrations/0001_initial.py`) y `backend/.env.example`.
- **No** deben aparecer `backend/.env`, `.venv` ni carpetas `__pycache__`. Si aparecen, ejecuta `git reset backend`, corrige el `.gitignore` y repite.

```powershell
git commit -m "Crea el backend Django con API REST de retos y avances"
git log --oneline -3
```

Si instalaste paquetes nuevos durante la práctica, actualiza antes `requirements.txt` desde `backend` con `python -m pip freeze | Set-Content -Encoding utf8 requirements.txt` e inclúyelo en el commit.

## 13. Errores frecuentes

| Mensaje | Causa | Solución |
| --- | --- | --- |
| `No module named 'django'` o `No module named 'dotenv'` | El entorno virtual no está activo | Apartado 1: activa `.venv`; debe verse `(.venv)` |
| `No such file or directory: manage.py` / `can't open file ... manage.py` | La terminal no está en `backend` | `Set-Location "$env:USERPROFILE\proyectos\SeguimientoRetos\backend"` |
| `ImproperlyConfigured: Falta la variable ... en backend/.env` | Falta esa variable o `.env` está en otra carpeta | Apartado 2: revisa nombre y ubicación (`backend\.env`) |
| `OperationalError: (2002, "Can't connect to server on '127.0.0.1' (10061)")` o `(2003, ...)` | MySQL detenido o escuchando en otro puerto | Diagnóstico del apartado 6.1 |
| `OperationalError: (1045, "Access denied for user 'retos_app'@'localhost'")` | `DB_HOST=localhost` o contraseña incorrecta | Usa `DB_HOST=127.0.0.1` y revisa `DB_PASSWORD` (entre comillas simples) |
| `OperationalError: (1049, "Unknown database ...")` | La base no existe o el nombre no coincide | Guía 02, apartado 1.3; revisa `DB_NAME` |
| `CommandError: ... already exists` o `'config' conflicts with the name of an existing Python module` al ejecutar `startproject` o `startapp` | El paso ya se hizo: la carpeta ya existe | No lo repitas ni cambies el nombre; continúa con el siguiente apartado |
| Se creó `backend\config\config` | Faltó el punto en `startproject config .` | Borra la carpeta `backend\config` creada y repite el apartado 3 con el punto |
| `No changes detected` en `makemigrations` | `retos` no está en `INSTALLED_APPS` o `models.py` no se guardó | Revisa el apartado 5 y guarda con `Ctrl+S` |
| `You have N unapplied migration(s)` | Faltan migraciones | `python manage.py migrate` |
| `Error: That port is already in use.` | Ya hay un `runserver` abierto | Detén el otro con `Ctrl+C` o usa `runserver 8001` |
| `DisallowedHost` / `Invalid HTTP_HOST header` | La dirección no está en `ALLOWED_HOSTS` | Añádela en `.env` y reinicia el servidor |
| `Got an error creating the test database: (1044, "Access denied ... 'test_seguimiento_retos'")` | Falta el permiso sobre la base de pruebas | Apartado 11.1 |
| `ERR_CONNECTION_REFUSED` en el navegador | El servidor no está en ejecución | Inicia `python manage.py runserver` y no cierres esa terminal |
| `ERR_CONNECTION_TIMED_OUT` en `http://10.0.2.2:8000/` | Se abrió desde el navegador de la PC, o el emulador usa un proxy | `10.0.2.2` solo funciona en el Chrome **del emulador**; si ya es así, apartado 10.3: proxy del emulador en **No proxy** |
| El emulador no abre `10.0.2.2:8000` | Servidor iniciado solo en `127.0.0.1` o falta `10.0.2.2` en `ALLOWED_HOSTS` | `runserver 0.0.0.0:8000` y revisa `.env`; tabla del apartado 10.3 |
| `Activate.ps1 no se puede cargar porque la ejecución de scripts está deshabilitada` | Política de ejecución de PowerShell | Apartado 1: `Set-ExecutionPolicy -Scope Process ...` |

## 14. Adaptar la guía a otro proyecto

Para otro proyecto con la misma arquitectura (Django + Angular/Ionic + Android) sigue los mismos apartados cambiando solo lo siguiente:

| Qué cambiar | Dónde | Ejemplo para un proyecto de biblioteca |
| --- | --- | --- |
| Carpeta raíz | Todos los `Set-Location` | `%USERPROFILE%\proyectos\Biblioteca` |
| Base, usuario y clave MySQL | Guía 02 (apartado 1.3) y `.env` | `biblioteca`, `biblioteca_app` |
| Permiso de pruebas | Apartado 11.1 | ``GRANT ALL PRIVILEGES ON `test_biblioteca`.* TO 'biblioteca_app'@'127.0.0.1';`` |
| Nombre de la aplicación | `startapp`, `INSTALLED_APPS` y `include('...urls')` en `config\urls.py` | `prestamos` |
| Modelos | `models.py` | `Libro`, `Prestamo` |
| Serializadores, vistas y rutas | `serializers.py`, `views.py`, `urls.py` de la aplicación | `LibroSerializer`, `LibroViewSet`, `router.register('libros', ...)` |
| Administrador | `admin.py` | `@admin.register(Libro)` |
| Pruebas | `tests.py`; los nombres `modelo-list` cambian con el modelo | `reverse('libro-list')` |
| Título de la documentación | `SPECTACULAR_SETTINGS` en `settings.py` | `API Biblioteca` |
| Zona horaria | `TIME_ZONE` en `settings.py` | `America/Guayaquil`, `America/Bogota`... |

**No cambian:** el nombre del proyecto Django `config`, la estructura de `settings.py`, el uso de `.env`, los paquetes, el puerto 3307 ni las direcciones `127.0.0.1:8000` y `10.0.2.2:8000`.

## 15. Lista de entrega

- [ ] `python manage.py check --database default` sin errores (Evidencia 1).
- [ ] Panel de administración con un reto y sus avances (Evidencia 2).
- [ ] Swagger en `/api/docs/` con una operación ejecutada y `/api/retos/` en el emulador (Evidencia 3).
- [ ] `python manage.py test retos` con las tres pruebas en `OK` (Evidencia 4).
- [ ] Commit realizado; `git status` no muestra `.env` ni `.venv`.
- [ ] Breve informe de dificultades encontradas y cómo se resolvieron.

Preguntas de reflexión:

1. ¿Por qué la contraseña de MySQL se guarda en `.env` y no en `settings.py`?
2. ¿Qué diferencia hay entre `makemigrations` y `migrate`?
3. ¿Por qué el emulador usa `10.0.2.2` y no `127.0.0.1`?
4. ¿Dónde se valida que el porcentaje no supere 100 y dónde que la fecha de fin no sea anterior a la de inicio? ¿Por qué en lugares distintos?

## Fuentes oficiales

- [Tutorial de Django 5.2](https://docs.djangoproject.com/en/5.2/intro/tutorial01/): proyecto, aplicaciones y servidor de desarrollo.
- [Bases de datos en Django 5.2: MySQL](https://docs.djangoproject.com/en/5.2/ref/databases/#mysql-notes): driver, `utf8mb4` y modo estricto.
- [Modelos y migraciones](https://docs.djangoproject.com/en/5.2/topics/migrations/).
- [Django REST Framework](https://www.django-rest-framework.org/): serializadores, viewsets y routers.
- [django-filter con DRF](https://django-filter.readthedocs.io/en/stable/guide/rest_framework.html).
- [drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/readme.html): esquema OpenAPI y Swagger.
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers): configuración de CORS.
- [python-dotenv](https://saurabh-kumar.com/python-dotenv/): lectura de `.env`.
