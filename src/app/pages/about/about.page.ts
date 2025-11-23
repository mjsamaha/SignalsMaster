import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, CommonModule]
})
export class AboutPage {
  constructor() {}
}

