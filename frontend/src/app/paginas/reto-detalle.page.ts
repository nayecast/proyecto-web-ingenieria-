import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { BehaviorSubject, catchError, of, switchMap } from 'rxjs';

import { ETIQUETA_ESTADO } from '../core/modelos';
import { RetosApi, mensajeError } from '../core/retos-api.service';
import {
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  SemanaEvaluada,
  fechaCorta,
  hoyIso,
} from '../core/semaforo';
import { SeguimientoService } from '../core/seguimiento.service';

@Component({
  selector: 'app-reto-detalle',
  imports: [
    AsyncPipe, ReactiveFormsModule, IonBackButton, IonBadge, IonButton, IonButtons, IonCard,
    IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader,
    IonInput, IonItem, IonLabel, IonList, IonNote, IonProgressBar, IonRange, IonSegment,
    IonSegmentButton, IonText, IonTitle, IonToolbar,
  ],
  styles: `
    .semana-actual { --background: var(--ion-color-primary-tint); }
    ion-progress-bar { margin-top: 6px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/retos"></ion-back-button>
        </ion-buttons>
        <ion-title>Seguimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (reto$ | async; as reto) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ reto.titulo }}</ion-card-title>
            <ion-card-subtitle>
              {{ etiquetaEstado[reto.estado] }} · {{ fechaCorta(reto.fecha_inicio) }} al {{ fechaCorta(reto.fecha_fin) }}
            </ion-card-subtitle>
          </ion-card-header>
          @if (reto.descripcion) {
            <ion-card-content>{{ reto.descripcion }}</ion-card-content>
          }
        </ion-card>
      } @else {
        <ion-text color="medium"><p>Cargando reto…</p></ion-text>
      }

      <ion-segment [value]="vista()" (ionChange)="vista.set($any($event).detail.value)">
        <ion-segment-button value="semanas"><ion-label>Semanas</ion-label></ion-segment-button>
        <ion-segment-button value="avances"><ion-label>Avances</ion-label></ion-segment-button>
      </ion-segment>

      @if (vista() === 'semanas') {
        @if (semanas$ | async; as semanas) {
          @if (semanas.length === 0) {
            <p>Este reto todavía no tiene semanas de seguimiento.</p>
            <ion-button expand="block" (click)="generarSemanas()">Generar semanas hasta la 15</ion-button>
          }
          <ion-list>
            @for (s of semanas; track s.id) {
              <ion-item [class.semana-actual]="s.editable" lines="full">
                <ion-label>
                  <h2>
                    Semana {{ s.semana }}
                    <ion-badge [color]="color[s.semaforo]">{{ etiqueta[s.semaforo] }}</ion-badge>
                  </h2>
                  <p>{{ fechaCorta(s.fecha_inicio) }} al {{ fechaCorta(s.fecha_fin) }} · {{ s.porcentaje }} %</p>
                  <ion-progress-bar [value]="s.porcentaje / 100" [color]="color[s.semaforo]"></ion-progress-bar>

                  @if (s.editable) {
                    <ion-range
                      aria-label="Porcentaje de la semana"
                      [value]="s.porcentaje" [min]="0" [max]="100" [step]="10"
                      [snaps]="true" [pin]="true"
                      (ionChange)="cambiarPorcentaje(s, $any($event).detail.value)"
                    ></ion-range>
                    <ion-note>
                      @if (s.diasRestantes === 0) { Se cierra hoy a medianoche. }
                      @else { Se cierra en {{ s.diasRestantes }} día(s). }
                    </ion-note>
                  }
                  @if (s.enRiesgo) {
                    <ion-text color="danger">
                      <p>Riesgo: si no avanzas, esta semana se cerrará en rojo.</p>
                    </ion-text>
                  }
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      } @else {
        <form [formGroup]="formAvance" (ngSubmit)="guardarAvance()">
          <ion-list>
            <ion-item>
              <ion-input label="Fecha" labelPlacement="stacked" type="date" formControlName="fecha"></ion-input>
            </ion-item>
            <ion-item>
              <ion-input label="¿Qué avanzaste?" labelPlacement="stacked" formControlName="descripcion"
                [maxlength]="255"></ion-input>
            </ion-item>
            <ion-item>
              <ion-input label="Porcentaje (0 a 100)" labelPlacement="stacked" type="number"
                formControlName="porcentaje" [min]="0" [max]="100"></ion-input>
            </ion-item>
          </ion-list>
          <ion-button expand="block" type="submit" [disabled]="formAvance.invalid">Registrar avance</ion-button>
        </form>

        @if (avances$ | async; as avances) {
          <ion-list>
            @for (a of avances; track a.id) {
              <ion-item>
                <ion-label>
                  <h3>{{ a.descripcion }}</h3>
                  <p>{{ fechaCorta(a.fecha) }} · {{ a.porcentaje }} %</p>
                </ion-label>
              </ion-item>
            } @empty {
              <ion-item><ion-label>Sin avances registrados.</ion-label></ion-item>
            }
          </ion-list>
        }
      }
    </ion-content>
  `,
})
export class RetoDetallePage {
  private readonly api = inject(RetosApi);
  private readonly seguimiento = inject(SeguimientoService);
  private readonly toast = inject(ToastController);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiqueta = ETIQUETA_SEMAFORO;
  protected readonly color = COLOR_SEMAFORO;
  protected readonly fechaCorta = fechaCorta;
  protected readonly vista = signal<'semanas' | 'avances'>('semanas');

  protected readonly reto$ = this.api.obtenerReto(this.id).pipe(catchError(() => of(null)));
  protected readonly semanas$ = this.seguimiento.semanasDeReto$(this.id);

  private readonly recargarAvances$ = new BehaviorSubject<void>(undefined);
  protected readonly avances$ = this.recargarAvances$.pipe(
    switchMap(() => this.api.listarAvances(this.id)),
  );

  protected readonly formAvance = new FormGroup({
    fecha: new FormControl(hoyIso(), { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    porcentaje: new FormControl<number | string>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
  });

  constructor() {
    // F7: resultado del guardado automático mientras esta página está abierta.
    this.seguimiento.guardado$
      .pipe(takeUntilDestroyed())
      .subscribe((r) => void this.mostrar(r.mensaje, r.ok ? 'success' : 'danger'));
  }

  protected cambiarPorcentaje(semana: SemanaEvaluada, valor: unknown): void {
    this.seguimiento.cambiarPorcentaje(semana, Number(valor));
  }

  protected generarSemanas(): void {
    this.api.generarSemanas(this.id).subscribe({
      next: (r) => {
        void this.mostrar(`${r.creadas} semana(s) creada(s).`, 'success');
        this.seguimiento.recargar();
      },
      error: (e) => void this.mostrar(mensajeError(e), 'danger'),
    });
  }

  protected guardarAvance(): void {
    const valor = this.formAvance.getRawValue();
    this.api
      .crearAvance({ reto: this.id, fecha: valor.fecha, descripcion: valor.descripcion, porcentaje: Number(valor.porcentaje) })
      .subscribe({
        next: () => {
          this.formAvance.reset({ fecha: hoyIso(), descripcion: '', porcentaje: 0 });
          this.recargarAvances$.next();
          void this.mostrar('Avance registrado.', 'success');
        },
        error: (e) => void this.mostrar(mensajeError(e), 'danger'),
      });
  }

  private async mostrar(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const aviso = await this.toast.create({ message: mensaje, color, duration: 2500 });
    await aviso.present();
  }
}
