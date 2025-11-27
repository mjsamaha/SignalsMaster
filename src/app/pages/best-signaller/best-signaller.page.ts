import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * BestSignallerPage allows users to enter a username and start a competitive quiz.
 * Handles username validation and navigation to the quiz.
 */
@Component({
  selector: 'app-best-signaller',
  templateUrl: './best-signaller.page.html',
  styleUrls: ['./best-signaller.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonText, CommonModule, FormsModule]
})
export class BestSignallerPage {
  /**
   * Stores the entered username for competition.
   */
  username: string = '';
  /**
   * Indicates if the username is valid for submission.
   */
  isUsernameValid: boolean = false;
  /**
   * Message describing username validation errors.
   */
  validationMessage: string = '';

  /**
   * Injects router for navigation.
   */
  constructor(private router: Router) {}

  /**
   * Validates the username input for length and allowed characters.
   * Updates validation state and message accordingly.
   */
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

    // Only allow alphanumeric, spaces, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(trimmed)) {
      this.isUsernameValid = false;
      this.validationMessage = 'Username can only contain letters, numbers, spaces, hyphens, and underscores';
      return;
    }

    this.isUsernameValid = true;
    this.validationMessage = '';
  }

  /**
   * Returns the current character count for the username field.
   */
  getCharacterCount(): string {
    return `${this.username.length}/20`;
  }

  /**
   * Navigates to the competitive quiz if the username is valid.
   */
  startCompetition(): void {
    if (this.isUsernameValid) {
      this.router.navigate(['/quiz', 'competitive', this.username.trim()]);
    }
  }
}
