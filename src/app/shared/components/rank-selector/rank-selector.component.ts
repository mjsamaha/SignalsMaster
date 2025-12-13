/**
 * Rank Selector Component
 * Custom dropdown for selecting user rank.
 * Implements ControlValueAccessor for use with Reactive Forms.
 */

import { Component, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Rank, RankDisplayNames, getAllRanks } from '../../../core/models/user.model';

@Component({
  selector: 'app-rank-selector',
  templateUrl: './rank-selector.component.html',
  styleUrls: ['./rank-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RankSelectorComponent),
      multi: true
    }
  ]
})
export class RankSelectorComponent implements ControlValueAccessor {
  private modalController = inject(ModalController);

  value: Rank | null = null;
  disabled = false;
  availableRanks = getAllRanks();
  RankDisplayNames = RankDisplayNames;

  private onChange: (value: Rank | null) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Get display text for selected rank
   */
  getDisplayText(): string {
    return this.value ? RankDisplayNames[this.value] : 'Select your rank';
  }

  /**
   * Open rank selection modal
   */
  async openRankModal() {
    if (this.disabled) return;

    const modal = await this.modalController.create({
      component: RankSelectionModal,
      componentProps: {
        selectedRank: this.value,
        availableRanks: this.availableRanks
      },
      cssClass: 'rank-modal',
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.rank) {
      this.writeValue(data.rank);
      this.onChange(data.rank);
      this.onTouched();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: Rank | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: Rank | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

/**
 * Rank Selection Modal Component
 */
@Component({
  selector: 'app-rank-selection-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Select Rank</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item
          *ngFor="let rank of availableRanks; trackBy: trackByRank"
          button
          [detail]="false"
          (click)="selectRank(rank)"
          [class.selected]="rank === selectedRank"
        >
          <ion-label>
            <h2>{{ getRankDisplayName(rank) }}</h2>
            <p>{{ rank }}</p>
          </ion-label>
          <ion-icon
            *ngIf="rank === selectedRank"
            name="checkmark-circle"
            slot="end"
            color="primary"
          ></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    ion-header {
      flex-shrink: 0;
    }

    ion-content {
      --background: white;
      flex: 1;
      overflow-y: auto;
    }

    ion-list {
      background: transparent;
      padding: 0;
      margin: 0;
    }

    ion-item {
      --background: white;
      --padding-start: 20px;
      --padding-end: 20px;
      --inner-padding-end: 20px;
      --min-height: 72px;
      margin-bottom: 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.15s ease;
      cursor: pointer;
    }

    ion-item:last-child {
      border-bottom: none;
    }

    ion-item:hover:not(.selected) {
      --background: rgba(var(--ion-color-primary-rgb), 0.05);
    }

    ion-item:active {
      --background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    ion-item.selected {
      --background: var(--ion-color-primary-tint);
      --color: var(--ion-color-primary-contrast);
      border-left: 4px solid var(--ion-color-primary);
    }

    ion-label {
      margin: 12px 0;
    }

    ion-label h2 {
      font-weight: 600;
      color: var(--ion-color-dark);
      font-size: 1.05rem;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }

    ion-label p {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-family: monospace;
      letter-spacing: 0.5px;
    }

    ion-item.selected ion-label h2 {
      color: var(--ion-color-primary);
      font-weight: 700;
    }

    ion-item.selected ion-label p {
      color: var(--ion-color-primary-shade);
    }

    ion-icon[name="checkmark-circle"] {
      font-size: 1.75rem;
      color: var(--ion-color-primary);
    }

    @media (min-width: 768px) {
      ion-item {
        --min-height: 68px;
      }

      ion-item:hover:not(.selected) {
        transform: translateX(4px);
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RankSelectionModal {
  private modalController = inject(ModalController);

  selectedRank: Rank | null = null;
  availableRanks: Rank[] = [];
  readonly RankDisplayNames = RankDisplayNames;

  getRankDisplayName(rank: Rank): string {
    return this.RankDisplayNames[rank];
  }

  trackByRank(index: number, rank: Rank): Rank {
    return rank;
  }

  selectRank(rank: Rank) {
    this.modalController.dismiss({ rank });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
