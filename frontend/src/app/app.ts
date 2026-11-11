import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonContent, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IonApp, IonContent, IonButton],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'frontend';
}