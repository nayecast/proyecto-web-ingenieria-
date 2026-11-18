import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export interface Reto {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO';
  total_avances: number;
}

interface PaginaRetos {
  next: string | null;
  results: Reto[];
}

@Injectable({ providedIn: 'root' })
export class RetosApi {
  private readonly http = inject(HttpClient);
  private readonly host = Capacitor.getPlatform() === 'android' ? '10.0.2.2' : '127.0.0.1';

  crearReto(datos: { titulo: string; descripcion: string; fecha_inicio: string; fecha_fin?: string }) {
    return this.http.post<Reto>(`http://${this.host}:8000/api/retos/`, datos);
  }

  registrarAvance(datos: { reto: number; fecha: string; descripcion: string; porcentaje: number }) {
    return this.http.post(`http://${this.host}:8000/api/avances/`, datos);
  }

  listar(pagina: number) {
    return this.http.get<PaginaRetos>(`http://${this.host}:8000/api/retos/`, {
      params: { page: pagina },
    });
  }
}
