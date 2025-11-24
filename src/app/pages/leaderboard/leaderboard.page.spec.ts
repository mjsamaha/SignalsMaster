import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { LeaderboardPage } from './leaderboard.page';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

describe('LeaderboardPage', () => {
  let component: LeaderboardPage;
  let fixture: ComponentFixture<LeaderboardPage>;
  let leaderboardServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    leaderboardServiceMock = {
      getLeaderboard: jasmine.createSpy('getLeaderboard').and.returnValue(of([
        { id: '1', username: 'testuser1', rating: 100, accuracy: 90, totalTime: 120, correctAnswers: 45, totalQuestions: 50, timestamp: Date.now(), rank: 1, tier: 'Signals Master', sessionId: 'session1' },
        { id: '2', username: 'testuser2', rating: 90, accuracy: 85, totalTime: 150, correctAnswers: 42, totalQuestions: 50, timestamp: Date.now(), rank: 2, tier: 'Top Signaller', sessionId: 'session2' }
      ]))
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), CommonModule, LeaderboardPage],
      providers: [
        { provide: LeaderboardService, useValue: leaderboardServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load leaderboard entries on init', () => {
    expect(leaderboardServiceMock.getLeaderboard).toHaveBeenCalled();
    expect(component.entries.length).toBe(2);
    expect(component.entries[0].username).toBe('testuser1');
  });

  it('should navigate to compete page', () => {
    component.navigateToCompete();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/tabs/best-signaller']);
  });

  it('should return correct tier badge', () => {
    expect(component.getTierBadge(1)).toBe('🥇');
    expect(component.getTierBadge(5)).toBe('🥈');
    expect(component.getTierBadge(20)).toBe('🌟');
    expect(component.getTierBadge(60)).toBe('📈');
    expect(component.getTierBadge(110)).toBe('📍');
  });

  it('should return correct tier class', () => {
    expect(component.getTierClass(1)).toBe('tier-1');
    expect(component.getTierClass(5)).toBe('tier-2');
    expect(component.getTierClass(20)).toBe('tier-3');
    expect(component.getTierClass(60)).toBe('tier-4');
    expect(component.getTierClass(110)).toBe('tier-5');
  });

  it('should format time correctly', () => {
    expect(component.formatTime(125)).toBe('02:05');
    expect(component.formatTime(59)).toBe('00:59');
  });
});
