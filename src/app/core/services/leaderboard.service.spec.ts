/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { NgZone, ApplicationRef } from '@angular/core';
import { of } from 'rxjs';

import { LeaderboardService } from './leaderboard.service';
import { CompetitiveResults } from './quiz.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let firestoreMock: any;
  let ngZoneMock: any;
  let addDocSpy: jasmine.Spy;
  let collectionSpy: jasmine.Spy;

  beforeEach(() => {
    // Mock NgZone
    ngZoneMock = {
      run: jasmine.createSpy('run').and.callFake((fn: any) => fn()),
      runOutsideAngular: jasmine.createSpy('runOutsideAngular').and.callFake((fn: any) => fn())
    };

    // Mock Firestore methods
    addDocSpy = jasmine.createSpy('addDoc');
    collectionSpy = jasmine.createSpy('collection').and.returnValue('mockCollection');

    firestoreMock = {
      collection: collectionSpy
    };

    // Mock ApplicationRef - FIXED: Use the actual ApplicationRef token
    const applicationRefMock = {
      isStable: of(true),
      tick: jasmine.createSpy('tick')
    };

    TestBed.configureTestingModule({
      providers: [
        LeaderboardService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: NgZone, useValue: ngZoneMock },
        { provide: ApplicationRef, useValue: applicationRefMock } // FIXED: Remove quotes
      ]
    });

    service = TestBed.inject(LeaderboardService);
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
      expect(result).toBe(true); // FIXED: Changed from .equal() to .toBe()
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
      expect(result).toBe(false); // FIXED
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
      expect(result).toBe(false); // FIXED
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
      expect(result).toBe(false); // FIXED
    });
  });

  describe('submitScore', () => {
    beforeEach(() => {
      // Mock addDoc to resolve successfully
      addDocSpy.and.returnValue(Promise.resolve({ id: 'testDocId' }));
      spyOn(service, 'submitScore' as any).and.callThrough();
    });

    it('should call validation and succeed for valid data', async () => {
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

      const response = await service.submitScore(validResults);

      expect(response.success).toBe(true); // FIXED
      expect(response.message).toBe('Score submitted successfully!'); // FIXED
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

      expect(response.success).toBe(false); // FIXED
      expect(response.message).toBe('Invalid submission data'); // FIXED
    });
  });
});

describe('Leaderboard Data Processing', () => {
  let service: LeaderboardService;
  let firestoreMock: any;
  let ngZoneMock: any;

  beforeEach(() => {
    ngZoneMock = {
      run: jasmine.createSpy('run').and.callFake((fn: any) => fn()),
      runOutsideAngular: jasmine.createSpy('runOutsideAngular').and.callFake((fn: any) => fn())
    };
    firestoreMock = {};

    // FIXED: Simplified ApplicationRef mock - just return of(true) directly
    const applicationRefMock = {
      isStable: of(true),
      tick: jasmine.createSpy('tick')
    };

    TestBed.configureTestingModule({
      providers: [
        LeaderboardService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: NgZone, useValue: ngZoneMock },
        { provide: ApplicationRef, useValue: applicationRefMock } // FIXED: Use token, not string
      ]
    });

    service = TestBed.inject(LeaderboardService);
  });

  it('should correctly generate tier labels', () => {
    expect((service as any).getTierLabel(1)).toBe('Signals Master'); // FIXED
    expect((service as any).getTierLabel(5)).toBe('Top Signaller'); // FIXED
    expect((service as any).getTierLabel(12)).toBe(''); // FIXED
  });
});
