import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { NgZone } from '@angular/core';
import { addDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from '@angular/fire/firestore';

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
      run: jasmine.createSpy('run').and.callFake((fn) => fn())
    };

    // Mock Firestore methods
    addDocSpy = jasmine.createSpy('addDoc');
    collectionSpy = jasmine.createSpy('collection').and.returnValue('mockCollection');

    firestoreMock = {
      collection: collectionSpy
    };

    TestBed.configureTestingModule({
      providers: [
        LeaderboardService,
        { provide: Firestore, useValue: firestoreMock },
        { provide: NgZone, useValue: ngZoneMock }
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
        finalRating: 150, // Between 0-5000 as per rules
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
        username: 'Ab', // Too short, min 3 chars
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
        username: 'VeryLongUsernameThatExceedsTwentyCharacters', // >20 chars
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
        finalRating: -10, // Negative
        ratingTier: 'Expert Signaller',
        sessionId: 'session123',
        completedAt: new Date(),
        answers: []
      };

      const result = (service as any).validateResults(invalidResults);
      expect(result).toBe(false);
    });

// TODO: Update remaining test cases with full CompetitiveResults objects
// Keeping validation focused on key fields (username, rating >100, accuracy, totalTime)
  });

  describe('submitScore', () => {
    beforeEach(() => {
      // Mock addDoc to resolve successfully
      addDocSpy.and.returnValue(Promise.resolve({ id: 'testDocId' }));

      // Use actual addDoc and collection for the spy chain
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

      expect(response.success).toBe(true);
      expect(response.message).toBe('Score submitted successfully!');
    });

    it('should reject submission for invalid data', async () => {
      const invalidResults: CompetitiveResults = {
        username: 'A', // Too short
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

// Tests for getLeaderboard would require more complex mocking of onSnapshot and Observable
// For now, focus on validation and submitScore since that's where the issue likely is

});

// Additional helper test for data transformation
describe('Leaderboard Data Processing', () => {
  it('should correctly generate tier labels', () => {
    const service = new LeaderboardService({} as Firestore, {} as NgZone);

    expect((service as any).getTierLabel(1)).toBe('Signals Master');
    expect((service as any).getTierLabel(5)).toBe('Top Signaller');
    expect((service as any).getTierLabel(12)).toBe('');
  });
});
