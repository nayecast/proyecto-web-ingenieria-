import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, notifications } from 'ionicons/icons';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, skip, take } from 'rxjs';

import { ETIQUETA_ESTADO } from '../core/modelos';
import { ResumenReto, fechaCorta } from '../core/semaforo';
import { SeguimientoService } from '../core/seguimiento.service';

const RESUMEN_VACIO: ResumenReto = { ROJO: 0, AMARILLO: 0, VERDE: 0, ABIERTA: 0, PENDIENTE: 0 };

@Component({
  selector: 'app-retos-lista',
  imports: [
    AsyncPipe, RouterLink, IonBadge, IonButton, IonButtons, IonChip, IonContent, IonFab,
    IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonRefresher,
    IonRefresherContent, IonSearchbar, IonText, IonTitle, IonToolbar,
  ],
  styles: `.semaforos { display: flex; gap: 4px; }`,
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mis retos</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/alertas" aria-label="Ver alertas">
            <ion-icon slot="icon-only" name="notifications"></ion-icon>
            @if (totalAlertas$ | async; as total) {
              <ion-badge color="danger">{{ total }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar reto"
          (ionInput)="buscar($any($event).detail.value)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($any($event))">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (error$ | async; as error) {
        <ion-text color="danger"><p class="ion-padding">{{ error }}</p></ion-text>
      }

      @if (vista$ | async; as vista) {
        @if (vista.length === 0) {
          <p class="ion-padding">No hay retos. Pulsa + para crear el primero.</p>
        }
        <ion-list>
          @for (item of vista; track item.reto.id) {
            <ion-item [routerLink]="['/retos', item.reto.id]" detail>
              <ion-label>
                <h2>{{ item.reto.titulo }}</h2>
                <p>{{ etiquetaEstado[item.reto.estado] }} · inicia {{ fechaCorta(item.reto.fecha_inicio) }}</p>
              </ion-label>
              <div slot="end" class="semaforos">
                @if (item.resumen.ROJO) { <ion-chip color="danger">{{ item.resumen.ROJO }}</ion-chip> }
                @if (item.resumen.AMARILLO) { <ion-chip color="warning">{{ item.resumen.AMARILLO }}</ion-chip> }
                @if (item.resumen.VERDE) { <ion-chip color="success">{{ item.resumen.VERDE }}</ion-chip> }
              </div>
            </ion-item>
          }
        </ion-list>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/retos/nuevo" aria-label="Nuevo reto">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class RetosListaPage {
  private readonly seguimiento = inject(SeguimientoService);
  private readonly busqueda$ = new BehaviorSubject<string>('');

  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly fechaCorta = fechaCorta;
  protected readonly error$ = this.seguimiento.error$;
  protected readonly totalAlertas$ = this.seguimiento.totalAlertas$;

  // F2: búsqueda reactiva combinada con los retos (F1) y el resumen de semáforos (F4).
  protected readonly vista$ = combineLatest([
    this.seguimiento.retos$,
    this.busqueda$.pipe(
      debounceTime(300),
      map((texto) => texto.trim().toLowerCase()),
      distinctUntilChanged(),
    ),
    this.seguimiento.resumen$,
  ]).pipe(
    map(([retos, texto, resumen]) =>
      retos
        .filter((reto) => reto.titulo.toLowerCase().includes(texto))
        .map((reto) => ({ reto, resumen: resumen.get(reto.id) ?? RESUMEN_VACIO })),
    ),
  );

  constructor() {
    addIcons({ add, notifications });
  }

  protected buscar(texto: string | null | undefined): void {
    this.busqueda$.next(texto ?? '');
  }

  protected refrescar(evento: { target: { complete(): void } }): void {
    this.seguimiento.recargar();
    // Cierra el indicador cuando llegan los datos nuevos (skip(1) salta el valor actual).
    this.seguimiento.retos$.pipe(skip(1), take(1)).subscribe(() => evento.target.complete());
  }
}
