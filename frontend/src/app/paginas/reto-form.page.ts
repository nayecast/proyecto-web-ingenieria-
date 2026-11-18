import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { EstadoReto } from '../core/modelos';
import { RetosApi, mensajeError } from '../core/retos-api.service';
import { hoyIso } from '../core/semaforo';
import { SeguimientoService } from '../core/seguimiento.service';

@Component({
  selector: 'app-reto-form',
  imports: [
    ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput,
    IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonText, IonTextarea, IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/retos"></ion-back-button>
        </ion-buttons>
        <ion-title>Nuevo reto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item>
            <ion-input label="Título" labelPlacement="stacked" formControlName="titulo"
              [maxlength]="150" placeholder="Ej.: Leer 10 libros"></ion-input>
          </ion-item>
          <ion-item>
            <ion-textarea label="Descripción" labelPlacement="stacked"
              formControlName="descripcion" [autoGrow]="true"></ion-textarea>
          </ion-item>
          <ion-item>
            <ion-input label="Fecha de inicio" labelPlacement="stacked" type="date"
              formControlName="fecha_inicio"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="Fecha de fin (opcional)" labelPlacement="stacked" type="date"
              formControlName="fecha_fin"></ion-input>
          </ion-item>
          <ion-item>
            <ion-select label="Estado" labelPlacement="stacked" formControlName="estado"
              interface="popover">
              <ion-select-option value="PENDIENTE">Pendiente</ion-select-option>
              <ion-select-option value="EN_CURSO">En curso</ion-select-option>
              <ion-select-option value="COMPLETADO">Completado</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        @if (form.controls.titulo.invalid && form.controls.titulo.touched) {
          <ion-text color="danger"><p>El título es obligatorio.</p></ion-text>
        }

        <ion-note>
          Al guardar se crean automáticamente las tareas semanales desde la semana actual hasta la 15.
        </ion-note>

        <ion-button expand="block" type="submit" [disabled]="form.invalid || guardando()">
          Guardar reto
        </ion-button>
      </form>
    </ion-content>
  `,
})
export class RetoFormPage {
  private readonly api = inject(RetosApi);
  private readonly seguimiento = inject(SeguimientoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);

  protected readonly form = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', { nonNullable: true }),
    fecha_inicio: new FormControl(hoyIso(), { nonNullable: true, validators: [Validators.required] }),
    fecha_fin: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoReto>('EN_CURSO', { nonNullable: true }),
  });

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.guardando.set(true);
    this.api.crearReto({ ...valor, fecha_fin: valor.fecha_fin || null }).subscribe({
      next: (reto) => {
        this.guardando.set(false);
        this.seguimiento.recargar();
        void this.router.navigate(['/retos', reto.id], { replaceUrl: true });
      },
      error: async (e) => {
        this.guardando.set(false);
        const aviso = await this.toast.create({
          message: mensajeError(e), color: 'danger', duration: 4000,
        });
        await aviso.present();
      },
    });
  }
}
