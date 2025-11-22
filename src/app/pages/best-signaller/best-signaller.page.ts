import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-best-signaller',
  templateUrl: './best-signaller.page.html',
  styleUrls: ['./best-signaller.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText, CommonModule, FormsModule]
})
export class BestSignallerPage {
  username: string = '';
  isUsernameValid: boolean = false;
  validationMessage: string = '';

  constructor(private router: Router) {}

  validateUsername(): void {
    const trimmed = this.username.trim();

    if (trimmed.length === 0) {
      this.isUsernameValid = false;
      this.validationMessage = 'Username is required';
      return;
    }

    if (trimmed.length < 3) {
      this.isUsernameValid = false;
      this.validationMessage = 'Username must be at least 3 characters';
      return;
    }

    if (trimmed.length > 20) {
      this.isUsernameValid = false;
      this.validationMessage = 'Username must be no more than 20 characters';
      return;
    }

    // Check for valid characters: alphanumeric + spaces/hyphens/underscores
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(trimmed)) {
      this.isUsernameValid = false;
      this.validationMessage = 'Username can only contain letters, numbers, spaces, hyphens, and underscores';
      return;
    }

    this.isUsernameValid = true;
    this.validationMessage = '';
  }

  getCharacterCount(): string {
    return `${this.username.length}/20`;
  }

  startCompetition(): void {
    if (this.isUsernameValid) {
      this.router.navigate(['/quiz', 'competitive', this.username.trim()]);
    }
  }
}
