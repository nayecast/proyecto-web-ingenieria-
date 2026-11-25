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
import { BehaviorSubject, catchError, map, of, switchMap } from 'rxjs';

import { ETIQUETA_ESTADO } from '../core/modelos';
import { RetosApi, mensajeError } from '../core/retos-api.service';
import {
  COLOR_SEMAFORO,
  ETIQUETA_SEMAFORO,
  META,
  SemanaEvaluada,
  calcularRachas,
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
    .tarjeta-rachas ion-card-content { display: flex; align-items: center; gap: 16px; }
    .tilo {
      position: relative;
      flex: 0 0 76px;
      height: 76px;
      border-radius: 50%;
      background: #e1f4df;
    }
    .tilo::before, .tilo::after {
      content: '';
      position: absolute;
      top: 12px;
      width: 18px;
      height: 13px;
      background: #39845c;
      border-radius: 90% 0 90% 0;
    }
    .tilo::before { left: 22px; transform: rotate(65deg); }
    .tilo::after { right: 20px; top: 8px; }
    .tilo-cara {
      position: absolute;
      inset: 25px 12px 10px;
      border-radius: 48% 48% 44% 44%;
      background: #86c977;
      box-shadow: inset 0 -4px #64ac5c;
    }
    .tilo-cara::before {
      content: '';
      position: absolute;
      top: 13px;
      left: 14px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #183c2a;
      box-shadow: 19px 0 #183c2a, -4px 8px #eea18f, 23px 8px #eea18f;
    }
    .tilo-boca {
      position: absolute;
      top: 22px;
      left: 22px;
      width: 8px;
      border-bottom: 2px solid #183c2a;
    }
    .tilo-en-racha { background: #ffedbc; }
    .tilo-en-racha .tilo-boca { height: 6px; border-radius: 0 0 50% 50%; }
    .tilo-mensaje { margin-top: 6px; }
    .plan { margin-inline: 0; }
    .plan-resumen {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-block: 0 16px;
    }
    .plan-resumen div, .plan-metas li {
      background: rgba(var(--ion-color-primary-rgb), .08);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .plan-resumen dd { margin: 0; font-size: 1.35rem; font-weight: 700; }
    .plan-control { margin-top: 20px; }
    .plan h3 { font-size: 1rem; font-weight: 700; margin-block: 16px 8px; }
    .plan-metas { display: grid; gap: 8px; padding: 0; list-style: none; }
    .plan-metas li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .plan-metas strong { color: var(--ion-color-primary-shade); }
    .plan ion-button { margin-top: 12px; }
    .historial { margin-inline: 0; }
    .historial-semanas { display: grid; gap: 16px; list-style: none; margin: 0; padding: 0; }
    .historial-etiqueta { display: flex; justify-content: space-between; gap: 8px; }
    .historial-etiqueta strong { color: var(--ion-text-color, #222); }
    .historial ion-progress-bar { height: 8px; border-radius: 8px; }
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

      <ion-segment [scrollable]="true" [value]="vista()" (ionChange)="vista.set($any($event).detail.value)">
        <ion-segment-button value="semanas"><ion-label>Semanas</ion-label></ion-segment-button>
        <ion-segment-button value="avances"><ion-label>Avances</ion-label></ion-segment-button>
        <ion-segment-button value="plan"><ion-label>Mi plan</ion-label></ion-segment-button>
        <ion-segment-button value="historial"><ion-label>Historial</ion-label></ion-segment-button>
      </ion-segment>

      @if (vista() === 'semanas') {
        @if (semanas$ | async; as semanas) {
          @if (semanas.length === 0) {
            <p>Este reto todavía no tiene semanas de seguimiento.</p>
            <ion-button expand="block" (click)="generarSemanas()">Generar semanas hasta la 15</ion-button>
          } @else if (rachas$ | async; as rachas) {
            <ion-card class="tarjeta-rachas">
              <ion-card-header><ion-card-title>Rachas de cumplimiento</ion-card-title></ion-card-header>
              <ion-card-content>
                <div class="tilo" [class.tilo-en-racha]="rachas.actual > 0" aria-hidden="true">
                  <div class="tilo-cara"><span class="tilo-boca"></span></div>
                </div>
                <div>
                  <p><strong>Racha actual</strong> · {{ rachas.actual }} {{ rachas.actual === 1 ? 'semana' : 'semanas' }}</p>
                  <p><strong>Mejor racha</strong> · {{ rachas.mejor }} {{ rachas.mejor === 1 ? 'semana' : 'semanas' }}</p>
                  <p class="tilo-mensaje" aria-live="polite"><strong>Tilo</strong> ·
                    @if (rachas.actual > 0) { ¡Tu racha está creciendo! }
                    @else if (rachas.mejor > 0) { Cada semana es una oportunidad para volver a empezar. }
                    @else { Completa una semana al 100 % y empecemos a crecer. }
                  </p>
                </div>
              </ion-card-content>
            </ion-card>
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
      } @else if (vista() === 'plan') {
        @if (semanas$ | async; as semanas) {
          <ion-card class="plan">
            <ion-card-header>
              <ion-card-title>Tu plan para llegar al {{ meta }} %</ion-card-title>
              @if (semanaActual(semanas); as semana) {
                <ion-card-subtitle>Semana {{ semana.semana }} · Cierra el {{ fechaCorta(semana.fecha_fin) }}</ion-card-subtitle>
              }
            </ion-card-header>
            <ion-card-content>
              @if (semanaActual(semanas); as semana) {
                <dl class="plan-resumen">
                  <div><dt>Ya llevas</dt><dd>{{ semana.porcentaje }} %</dd></div>
                  <div><dt>Te faltan</dt><dd>{{ meta - semana.porcentaje }} puntos</dd></div>
                </dl>
                <ion-progress-bar aria-label="Avance semanal registrado" [value]="semana.porcentaje / meta"></ion-progress-bar>
                @if (semana.porcentaje >= meta) {
                  <h3>¡Meta de la semana cumplida!</h3>
                } @else {
                  @let dias = diasDelPlan(semana);
                  @if (maxDiasDelPlan(semana) > 1) {
                    <ion-range class="plan-control" label="¿En cuántos días quieres llegar a la meta?"
                      labelPlacement="stacked" [min]="1" [max]="maxDiasDelPlan(semana)"
                      [step]="1" [value]="dias" [snaps]="true"
                      (ionInput)="diasDisponibles.set(+$any($event).detail.value)"></ion-range>
                  }
                  <h3 aria-live="polite">Meta al final de cada día · {{ dias === 1 ? '1 día' : dias + ' días' }}</h3>
                  <ul class="plan-metas" role="list">
                    @for (metaDiaria of metasDiarias(semana.porcentaje, dias); track $index) {
                      <li>
                        <span>Día {{ $index + 1 }} · Suma {{ metaDiaria.incremento }} {{ metaDiaria.incremento === 1 ? 'punto' : 'puntos' }}</span>
                        <strong>Llega al {{ metaDiaria.total }} %</strong>
                      </li>
                    }
                  </ul>
                  <p>Cuando completes un avance, guarda en Semanas el porcentaje total que alcanzaste.</p>
                  <ion-button fill="outline" size="small" (click)="vista.set('semanas')">Ir a Semanas</ion-button>
                }
              } @else {
                <p>El simulador estará disponible cuando este reto tenga una semana en curso.</p>
              }
            </ion-card-content>
          </ion-card>
        }
      } @else if (vista() === 'historial') {
        @if (historial$ | async; as historial) {
          <ion-card class="historial">
            <ion-card-header>
              <ion-card-title>Progreso semanal</ion-card-title>
              <ion-card-subtitle>Meta de cada semana · {{ meta }} %</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ul class="historial-semanas" role="list">
                @for (semana of historial; track semana.id) {
                  <li>
                    <div class="historial-etiqueta">
                      <span>Semana {{ semana.semana }} · {{ semana.cerrada ? 'Cerrada' : 'En curso' }}</span>
                      <strong>{{ semana.porcentaje }} %</strong>
                    </div>
                    <ion-progress-bar aria-hidden="true" [color]="color[semana.semaforo]"
                      [value]="semana.porcentaje / meta"></ion-progress-bar>
                  </li>
                } @empty {
                  <li>El progreso aparecerá cuando empiece la primera semana de este reto.</li>
                }
              </ul>
            </ion-card-content>
          </ion-card>
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
  protected readonly vista = signal<'semanas' | 'avances' | 'plan' | 'historial'>('semanas');
  protected readonly diasDisponibles = signal(7);
  protected readonly meta = META;

  protected readonly reto$ = this.api.obtenerReto(this.id).pipe(catchError(() => of(null)));
  protected readonly semanas$ = this.seguimiento.semanasDeReto$(this.id);
  protected readonly rachas$ = this.semanas$.pipe(map(calcularRachas));
  protected readonly historial$ = this.semanas$.pipe(
    map((semanas) => semanas.filter((semana) => semana.cerrada || semana.editable)
      .sort((a, b) => a.semana - b.semana)),
  );

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

  protected semanaActual(semanas: SemanaEvaluada[]): SemanaEvaluada | undefined {
    return semanas.find((semana) => semana.editable);
  }

  protected metasDiarias(porcentaje: number, dias: number): { incremento: number; total: number }[] {
    const faltante = META - porcentaje;
    const ritmo = Math.floor(faltante / dias);
    const diasConExtra = faltante % dias;
    return Array.from({ length: dias }, (_, indice) => ({
      incremento: ritmo + (indice < diasConExtra ? 1 : 0),
      total: porcentaje + ritmo * (indice + 1) + Math.min(indice + 1, diasConExtra),
    }));
  }

  protected diasDelPlan(semana: SemanaEvaluada): number {
    return Math.min(this.diasDisponibles(), this.maxDiasDelPlan(semana));
  }

  protected maxDiasDelPlan(semana: SemanaEvaluada): number {
    return Math.min(semana.diasRestantes + 1, META - semana.porcentaje);
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
