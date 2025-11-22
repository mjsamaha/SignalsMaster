import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() startTime: number | null = null;
  @Input() mode: 'countdown' | 'elapsed' = 'elapsed';
  @Input() countdownSeconds: number = 60;

  elapsedTime: number = 0;
  remainingTime: number = 60;
  private interval: any;

  ngOnInit(): void {
    if (this.mode === 'countdown') {
      this.remainingTime = this.countdownSeconds;
      this.startCountdown();
    } else {
      this.startElapsedTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private startElapsedTimer(): void {
    const start = this.startTime || Date.now();
    this.interval = setInterval(() => {
      this.elapsedTime = Date.now() - start;
    }, 100);
  }

  private startCountdown(): void {
    this.interval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  get formattedTime(): string {
    if (this.mode === 'countdown') {
      return this.formatSeconds(this.remainingTime);
    }
    return this.formatMilliseconds(this.elapsedTime);
  }

  get isExpired(): boolean {
    return this.mode === 'countdown' && this.remainingTime === 0;
  }

  private formatMilliseconds(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

