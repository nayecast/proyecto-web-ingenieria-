import { TareaSemanal } from './modelos';

export type Semaforo = 'PENDIENTE' | 'ABIERTA' | 'VERDE' | 'AMARILLO' | 'ROJO';

// ---- Reglas del seguimiento: cámbialas aquí y se aplican en toda la app ----
/** Una semana cerrada con menos de este porcentaje queda en rojo. */
export const UMBRAL_ROJO = 10;
/** Porcentaje que debe alcanzar una semana para quedar en verde. */
export const META = 100;
/** Días antes del cierre en que se avisa del riesgo de cerrar en rojo. */
export const DIAS_AVISO_RIESGO = 2;

export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = {
  PENDIENTE: 'Por iniciar',
  ABIERTA: 'En curso',
  VERDE: 'Cumplida',
  AMARILLO: 'Incompleta',
  ROJO: 'No cumplida',
};

/** Colores de Ionic para cada estado. */
export const COLOR_SEMAFORO: Record<Semaforo, string> = {
  PENDIENTE: 'medium',
  ABIERTA: 'primary',
  VERDE: 'success',
  AMARILLO: 'warning',
  ROJO: 'danger',
};

export interface SemanaEvaluada extends TareaSemanal {
  semaforo: Semaforo;
  cerrada: boolean;
  editable: boolean;
  diasRestantes: number;
  enRiesgo: boolean;
}

export interface ResumenReto {
  ROJO: number;
  AMARILLO: number;
  VERDE: number;
  ABIERTA: number;
  PENDIENTE: number;
}

/** Fecha local de hoy en formato 'AAAA-MM-DD'. */
export function hoyIso(fecha = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Días entre dos fechas 'AAAA-MM-DD' (hasta - desde). */
export function diasEntre(desde: string, hasta: string): number {
  const aUtc = (iso: string) => {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return Date.UTC(anio, mes - 1, dia);
  };
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000);
}

/** '2026-11-16' -> '16/11' (sin conversiones de zona horaria). */
export function fechaCorta(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

/** Regla del semáforo. Las fechas 'AAAA-MM-DD' se comparan como texto. */
export function calcularSemaforo(
  porcentaje: number,
  fechaInicio: string,
  fechaFin: string,
  hoy: string,
): Semaforo {
  if (hoy < fechaInicio) {
    return 'PENDIENTE';
  }
  if (hoy <= fechaFin) {
    return 'ABIERTA';
  }
  if (porcentaje >= META) {
    return 'VERDE';
  }
  if (porcentaje < UMBRAL_ROJO) {
    return 'ROJO';
  }
  return 'AMARILLO';
}

/** Añade a una tarea su semáforo, si está cerrada, si es editable y si está en riesgo. */
export function evaluarSemana(tarea: TareaSemanal, hoy: string): SemanaEvaluada {
  const semaforo = calcularSemaforo(tarea.porcentaje, tarea.fecha_inicio, tarea.fecha_fin, hoy);
  const diasRestantes = Math.max(diasEntre(hoy, tarea.fecha_fin), 0);
  return {
    ...tarea,
    semaforo,
    cerrada: hoy > tarea.fecha_fin,
    editable: semaforo === 'ABIERTA',
    diasRestantes,
    enRiesgo:
      semaforo === 'ABIERTA' &&
      tarea.porcentaje < UMBRAL_ROJO &&
      diasRestantes <= DIAS_AVISO_RIESGO,
  };
}

/** Cuenta, por reto, cuántas semanas hay de cada color. */
export function resumirPorReto(semanas: SemanaEvaluada[]): Map<number, ResumenReto> {
  const resumen = new Map<number, ResumenReto>();
  for (const semana of semanas) {
    const actual = resumen.get(semana.reto) ?? {
      ROJO: 0, AMARILLO: 0, VERDE: 0, ABIERTA: 0, PENDIENTE: 0,
    };
    actual[semana.semaforo]++;
    resumen.set(semana.reto, actual);
  }
  return resumen;
}
