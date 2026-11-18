import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  scan,
  share,
  shareReplay,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import { Reto, TareaSemanal } from './modelos';
import { RetosApi, mensajeError } from './retos-api.service';
import { ResumenReto, SemanaEvaluada, evaluarSemana, hoyIso, resumirPorReto } from './semaforo';

export interface ResultadoGuardado {
  ok: boolean;
  mensaje: string;
}

/** Estado reactivo de la aplicación. Las páginas solo se suscriben a estos flujos. */
@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private readonly api = inject(RetosApi);

  /** Disparador de recarga: cada next() vuelve a pedir los datos al backend. */
  private readonly recargar$ = new BehaviorSubject<void>(undefined);

  /** Último error de carga, o null si todo fue bien. */
  readonly error$ = new BehaviorSubject<string | null>(null);

  // F1. Carga de datos -------------------------------------------------------
  readonly retos$: Observable<Reto[]> = this.recargar$.pipe(
    switchMap(() =>
      this.api.listarRetos().pipe(
        tap(() => this.error$.next(null)),
        catchError((e) => {
          this.error$.next(mensajeError(e));
          return of([] as Reto[]);
        }),
      ),
    ),
    shareReplay(1),
  );

  private readonly tareas$: Observable<TareaSemanal[]> = this.recargar$.pipe(
    switchMap(() =>
      this.api.listarTareas().pipe(
        catchError((e) => {
          this.error$.next(mensajeError(e));
          return of([] as TareaSemanal[]);
        }),
      ),
    ),
    shareReplay(1),
  );

  // F3. Reloj del periodo: revisa la fecha cada minuto; emite solo si cambia el día.
  readonly hoy$: Observable<string> = timer(0, 60_000).pipe(
    map(() => hoyIso()),
    distinctUntilChanged(),
    shareReplay(1),
  );

  // F4. Evaluación de semanas: datos + fecha => semáforo, cierre y riesgo.
  readonly semanas$: Observable<SemanaEvaluada[]> = combineLatest([this.tareas$, this.hoy$]).pipe(
    map(([tareas, hoy]) => tareas.map((tarea) => evaluarSemana(tarea, hoy))),
    shareReplay(1),
  );

  readonly resumen$: Observable<Map<number, ResumenReto>> = this.semanas$.pipe(
    map(resumirPorReto),
    shareReplay(1),
  );

  // F5. Detección de alertas -------------------------------------------------
  readonly rojas$: Observable<SemanaEvaluada[]> = this.semanas$.pipe(
    map((semanas) => semanas.filter((s) => s.semaforo === 'ROJO')),
    shareReplay(1),
  );

  readonly enRiesgo$: Observable<SemanaEvaluada[]> = this.semanas$.pipe(
    map((semanas) => semanas.filter((s) => s.enRiesgo)),
    shareReplay(1),
  );

  readonly totalAlertas$: Observable<number> = combineLatest([this.rojas$, this.enRiesgo$]).pipe(
    map(([rojas, riesgo]) => rojas.length + riesgo.length),
    distinctUntilChanged(),
  );

  // F6. Aviso de rojos nuevos: scan recuerda las ya vistas para avisar una sola vez.
  readonly nuevasRojas$: Observable<SemanaEvaluada[]> = this.rojas$.pipe(
    scan(
      (estado, rojas) => ({
        vistas: new Set(rojas.map((r) => r.id)),
        nuevas: rojas.filter((r) => !estado.vistas.has(r.id)),
      }),
      { vistas: new Set<number>(), nuevas: [] as SemanaEvaluada[] },
    ),
    map((estado) => estado.nuevas),
    filter((nuevas) => nuevas.length > 0),
  );

  // F7. Guardado automático del porcentaje de la semana en curso ----------------
  private readonly cambios$ = new Subject<{ tarea: SemanaEvaluada; porcentaje: number }>();

  readonly guardado$: Observable<ResultadoGuardado> = this.cambios$.pipe(
    debounceTime(400),
    switchMap(({ tarea, porcentaje }) =>
      this.api.actualizarTarea(tarea.id, { porcentaje }).pipe(
        map(() => ({ ok: true, mensaje: `Semana ${tarea.semana}: ${porcentaje} % guardado.` })),
        catchError((e) => of({ ok: false, mensaje: mensajeError(e) })),
      ),
    ),
    tap(() => this.recargar()),
    share(),
  );

  semanasDeReto$(retoId: number): Observable<SemanaEvaluada[]> {
    return this.semanas$.pipe(map((semanas) => semanas.filter((s) => s.reto === retoId)));
  }

  recargar(): void {
    this.recargar$.next();
  }

  cambiarPorcentaje(tarea: SemanaEvaluada, porcentaje: number): void {
    this.cambios$.next({ tarea, porcentaje });
  }
}
