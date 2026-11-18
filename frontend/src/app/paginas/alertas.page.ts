import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle, warning } from 'ionicons/icons';

import { fechaCorta } from '../core/semaforo';
import { SeguimientoService } from '../core/seguimiento.service';

@Component({
  selector: 'app-alertas',
  imports: [
    AsyncPipe, RouterLink, IonBackButton, IonBadge, IonButtons, IonContent, IonHeader, IonIcon,
    IonItem, IonLabel, IonList, IonListHeader, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="danger">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/retos"></ion-back-button>
        </ion-buttons>
        <ion-title>Alertas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-list-header>
          <ion-label>Semanas cerradas en rojo</ion-label>
        </ion-list-header>
        @for (s of (rojas$ | async) ?? []; track s.id) {
          <ion-item [routerLink]="['/retos', s.reto]" detail>
            <ion-icon slot="start" name="alert-circle" color="danger"></ion-icon>
            <ion-label>
              <h2>{{ s.reto_titulo }} · semana {{ s.semana }}</h2>
              <p>Cerró el {{ fechaCorta(s.fecha_fin) }} con {{ s.porcentaje }} %</p>
            </ion-label>
            <ion-badge slot="end" color="danger">No cumplida</ion-badge>
          </ion-item>
        } @empty {
          <ion-item><ion-label>No hay semanas en rojo.</ion-label></ion-item>
        }

        <ion-list-header>
          <ion-label>Semanas en riesgo</ion-label>
        </ion-list-header>
        @for (s of (enRiesgo$ | async) ?? []; track s.id) {
          <ion-item [routerLink]="['/retos', s.reto]" detail>
            <ion-icon slot="start" name="warning" color="warning"></ion-icon>
            <ion-label>
              <h2>{{ s.reto_titulo }} · semana {{ s.semana }}</h2>
              <p>{{ s.porcentaje }} % y se cierra en {{ s.diasRestantes }} día(s)</p>
            </ion-label>
          </ion-item>
        } @empty {
          <ion-item><ion-label>No hay semanas en riesgo.</ion-label></ion-item>
        }
      </ion-list>
    </ion-content>
  `,
})
export class AlertasPage {
  private readonly seguimiento = inject(SeguimientoService);

  protected readonly rojas$ = this.seguimiento.rojas$;
  protected readonly enRiesgo$ = this.seguimiento.enRiesgo$;
  protected readonly fechaCorta = fechaCorta;

  constructor() {
    addIcons({ alertCircle, warning });
  }
}
