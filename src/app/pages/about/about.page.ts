import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';
import { APP_VERSION } from '../../config/app-version';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, CommonModule]
})
export class AboutPage {
  appVersion = APP_VERSION;

  constructor() {
    addIcons({ chatbubblesOutline });
  }

  async navigateToFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }
    window.open('https://signalsmaster.sleekplan.app', '_blank', 'noopener,noreferrer');
  }
}

