import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { NgZone, ApplicationRef, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { of, Subject } from 'rxjs';

import { LeaderboardService } from './leaderboard.service';
import { CompetitiveResults } from './quiz.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    const ngZoneMock = {
      run: jasmine.createSpy('run').and.callFake((fn: any) => fn()),
      runOutsideAngular: jasmine.createSpy('runOutsideAngular').and.callFake((fn: any) => fn())
    };

    const firestoreMock = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    const isStableSubject = new Subject<boolean>();
    isStableSubject.next(true);

    const applicationRefMock = {
      isStable: isStableSubject.asObservable(),
      tick: jasmine.createSpy('tick'),
      viewCount: 0,
      components: [],
      attachView: jasmine.createSpy('attachView'),
      detachView: jasmine.createSpy('detachView')
    };

    TestBed.configureTestingModule({
      providers: [
        LeaderboardService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: NgZone, useValue: ngZoneMock },
        { provide: ApplicationRef, useValue: applicationRefMock }
      ]
    });

    injector = TestBed.inject(EnvironmentInjector);
    service = runInInjectionContext(injector, () => TestBed.inject(LeaderboardService));
  });

  describe('Validation Logic', () => {
    it('should pass validation for valid CompetitiveResults', () => {
      const validResults: CompetitiveResults = {
        username: 'TestUser123',
        totalQuestions: 50,
        correctAnswers: 40,
        accuracy: 80,
        totalTime: 500,
        averageTimePerQuestion: 10,
        baseRating: 75,
        speedBonus: 15,
        finalRating: 150,
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const result = (service as any).validateResults(validResults);
      expect(result).toBe(true);
    });

    it('should reject username too short', () => {
      const invalidResults: CompetitiveResults = {
        username: 'Ab',
        totalQuestions: 50,
        correctAnswers: 40,
        accuracy: 80,
        totalTime: 500,
        averageTimePerQuestion: 10,
        baseRating: 75,
        speedBonus: 15,
        finalRating: 100,
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const result = (service as any).validateResults(invalidResults);
      expect(result).toBe(false);
    });

    it('should reject username too long', () => {
      const invalidResults: CompetitiveResults = {
        username: 'VeryLongUsernameThatExceedsTwentyCharacters',
        totalQuestions: 50,
        correctAnswers: 40,
        accuracy: 80,
        totalTime: 500,
        averageTimePerQuestion: 10,
        baseRating: 75,
        speedBonus: 15,
        finalRating: 100,
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const result = (service as any).validateResults(invalidResults);
      expect(result).toBe(false);
    });

    it('should reject negative rating', () => {
      const invalidResults: CompetitiveResults = {
        username: 'TestUser',
        totalQuestions: 50,
        correctAnswers: 40,
        accuracy: 80,
        totalTime: 500,
        averageTimePerQuestion: 10,
        baseRating: 75,
        speedBonus: 15,
        finalRating: -10,
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const result = (service as any).validateResults(invalidResults);
      expect(result).toBe(false);
    });
  });

  describe('submitScore', () => {
    it('should call validation and succeed for valid data', () => {
      const validResults: CompetitiveResults = {
        username: 'ValidUser',
        totalQuestions: 50,
        correctAnswers: 45,
        accuracy: 90,
        totalTime: 300,
        averageTimePerQuestion: 6,
        baseRating: 85,
        speedBonus: 20,
        finalRating: 200,
        ratingTier: 'Signals Master',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const isValid = (service as any).validateResults(validResults);
      expect(isValid).toBe(true);
    });

    it('should reject submission for invalid data', async () => {
      const invalidResults: CompetitiveResults = {
        username: 'A',
        totalQuestions: 50,
        correctAnswers: 40,
        accuracy: 80,
        totalTime: 500,
        averageTimePerQuestion: 10,
        baseRating: 75,
        speedBonus: 15,
        finalRating: 100,
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const response = await service.submitScore(invalidResults);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Invalid submission data');
    });
  });

  describe('getTierLabel', () => {
    it('should correctly generate tier labels', () => {
      expect((service as any).getTierLabel(1)).toBe('Signals Master');
      expect((service as any).getTierLabel(5)).toBe('Top Signaller');
      expect((service as any).getTierLabel(12)).toBe('');
    });
  });
});
