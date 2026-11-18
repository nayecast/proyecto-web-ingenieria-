import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { urlApi } from './api.config';
import { Avance, NuevoAvance, NuevoReto, Pagina, Reto, TareaSemanal } from './modelos';

/** Solo habla con el backend. No guarda estado: eso es tarea de SeguimientoService. */
@Injectable({ providedIn: 'root' })
export class RetosApi {
  private readonly http = inject(HttpClient);
  private readonly base = urlApi();

  listarRetos(): Observable<Reto[]> {
    return this.http.get<Pagina<Reto>>(`${this.base}/retos/`).pipe(map((p) => p.results));
  }

  obtenerReto(id: number): Observable<Reto> {
    return this.http.get<Reto>(`${this.base}/retos/${id}/`);
  }

  crearReto(datos: NuevoReto): Observable<Reto> {
    return this.http.post<Reto>(`${this.base}/retos/`, datos);
  }

  generarSemanas(id: number): Observable<{ creadas: number }> {
    return this.http.post<{ creadas: number }>(`${this.base}/retos/${id}/generar-semanas/`, {});
  }

  listarTareas(): Observable<TareaSemanal[]> {
    return this.http.get<TareaSemanal[]>(`${this.base}/tareas/`);
  }

  actualizarTarea(
    id: number,
    cambios: Partial<Pick<TareaSemanal, 'porcentaje' | 'descripcion'>>,
  ): Observable<TareaSemanal> {
    return this.http.patch<TareaSemanal>(`${this.base}/tareas/${id}/`, cambios);
  }

  listarAvances(retoId: number): Observable<Avance[]> {
    const params = new HttpParams().set('reto', retoId);
    return this.http
      .get<Pagina<Avance>>(`${this.base}/avances/`, { params })
      .pipe(map((p) => p.results));
  }

  crearAvance(datos: NuevoAvance): Observable<Avance> {
    return this.http.post<Avance>(`${this.base}/avances/`, datos);
  }
}

/** Convierte un error HTTP en un mensaje legible para el usuario. */
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Sin conexión con el backend. ¿Está en ejecución "python manage.py runserver 0.0.0.0:8000"?';
    }
    if (error.error && typeof error.error === 'object') {
      // Django REST devuelve {"campo": ["mensaje"]} o {"non_field_errors": ["mensaje"]}.
      return Object.values(error.error as Record<string, unknown>).flat().join(' ');
    }
    return `Error ${error.status} del servidor.`;
  }
  return 'Error inesperado.';
}
