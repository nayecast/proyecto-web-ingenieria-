import { Component, inject, OnInit, signal } from '@angular/core';
import { IonApp, IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';

import { Reto, RetosApi } from './retos-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly api = inject(RetosApi);
  private pagina = 0;

  readonly retos = signal<Reto[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly mensaje = signal('');
  readonly retoSeleccionado = signal<number | null>(null);
  readonly error = signal(false);
  readonly hayMas = signal(false);
  readonly estados: Record<Reto['estado'], string> = {
    PENDIENTE: 'Pendiente',
    EN_CURSO: 'En curso',
    COMPLETADO: 'Completado',
  };

  ngOnInit() {
    this.cargarRetos();
  }

  crearReto(evento: Event, formulario: HTMLFormElement) {
    evento.preventDefault();
    if (this.guardando() || this.cargando()) return;
    const campos = new FormData(formulario);
    const titulo = String(campos.get('titulo') ?? '').trim();
    const fechaInicio = String(campos.get('fecha_inicio') ?? '');
    const fechaFin = String(campos.get('fecha_fin') ?? '');
    this.mensaje.set('');
    if (!titulo || (fechaFin && fechaFin < fechaInicio)) {
      this.mensaje.set('Escribe un título y comprueba que la fecha de fin sea igual o posterior al inicio.');
      return;
    }

    this.guardando.set(true);
    this.api.crearReto({
      titulo,
      descripcion: String(campos.get('descripcion') ?? '').trim(),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || undefined,
    }).subscribe({
      next: () => {
        formulario.reset();
        this.guardando.set(false);
        this.mensaje.set('Reto creado.');
        this.pagina = 0;
        this.retos.set([]);
        this.hayMas.set(false);
        this.cargarRetos();
      },
      error: () => this.informarError('No se pudo crear el reto. Revisa los datos y vuelve a intentarlo.'),
    });
  }

  registrarAvance(evento: Event, formulario: HTMLFormElement) {
    evento.preventDefault();
    const reto = this.retoSeleccionado();
    if (reto === null || this.guardando()) return;
    const campos = new FormData(formulario);
    const descripcion = String(campos.get('descripcion') ?? '').trim();
    this.mensaje.set('');
    if (!descripcion) {
      this.mensaje.set('Escribe una descripción del avance.');
      return;
    }

    this.guardando.set(true);
    this.api.registrarAvance({
      reto,
      fecha: String(campos.get('fecha') ?? ''),
      descripcion,
      porcentaje: Number(campos.get('porcentaje')),
    }).subscribe({
      next: () => {
        this.retos.update((retos) => retos.map((item) =>
          item.id === reto ? { ...item, total_avances: item.total_avances + 1 } : item,
        ));
        formulario.reset();
        this.retoSeleccionado.set(null);
        this.guardando.set(false);
        this.mensaje.set('Avance registrado.');
      },
      error: () => this.informarError('No se pudo registrar el avance. Revisa los datos y vuelve a intentarlo.'),
    });
  }

  private informarError(mensaje: string) {
    this.guardando.set(false);
    this.mensaje.set(mensaje);
  }

  cargarRetos() {
    if (this.cargando() || this.guardando()) return;

    const pagina = this.pagina + 1;
    this.cargando.set(true);
    this.error.set(false);

    this.api.listar(pagina).subscribe({
      next: ({ results, next }) => {
        this.retos.update((retos) => [...retos, ...results]);
        this.pagina = pagina;
        this.hayMas.set(next !== null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }
}
