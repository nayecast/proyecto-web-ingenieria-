export type EstadoReto = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO';

export const ETIQUETA_ESTADO: Record<EstadoReto, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
};

export interface Reto {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string; // 'AAAA-MM-DD'
  fecha_fin: string | null;
  estado: EstadoReto;
  total_avances: number;
  creado: string;
  actualizado: string;
}

export interface NuevoReto {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoReto;
}

export interface Avance {
  id: number;
  reto: number;
  fecha: string;
  descripcion: string;
  porcentaje: number;
  creado: string;
}

export type NuevoAvance = Omit<Avance, 'id' | 'creado'>;

export interface TareaSemanal {
  id: number;
  reto: number;
  reto_titulo: string;
  semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  porcentaje: number;
  actualizado: string;
}

/** Respuesta paginada de Django REST Framework. */
export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
