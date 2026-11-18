import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular';

import { SeguimientoService } from './core/seguimiento.service';
import { SemanaEvaluada } from './core/semaforo';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class App {
  private readonly toast = inject(ToastController);
  private readonly router = inject(Router);

  constructor() {
    // F6: escucha durante toda la vida de la app; avisa cada vez que una semana pasa a rojo.
    inject(SeguimientoService)
      .nuevasRojas$.pipe(takeUntilDestroyed())
      .subscribe((nuevas) => this.avisarRojas(nuevas));
  }

  private async avisarRojas(nuevas: SemanaEvaluada[]): Promise<void> {
    const detalle = nuevas.map((s) => `${s.reto_titulo} (semana ${s.semana})`).join(', ');
    const aviso = await this.toast.create({
      header: `${nuevas.length} semana(s) cerrada(s) en rojo`,
      message: detalle,
      color: 'danger',
      position: 'top',
      duration: 8000,
      buttons: [{ text: 'Ver', handler: () => void this.router.navigate(['/alertas']) }],
    });
    await aviso.present();
  }
}
