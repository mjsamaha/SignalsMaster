import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';

/**
 * Mock Firestore for unit testing
 * Simulates Firestore operations without connecting to Firebase
 */
export class MockFirestore {
  private collections = new Map<string, any[]>();

  collection(path: string) {
    return {
      add: jasmine.createSpy('add').and.callFake((data: any) => {
        if (!this.collections.has(path)) {
          this.collections.set(path, []);
        }
        const id = `mock_${Date.now()}_${Math.random()}`;
        const docData = { id, ...data };
        this.collections.get(path)!.push(docData);
        return Promise.resolve({ id });
      }),
      doc: (id: string) => ({
        set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
        update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
        delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
        get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
          exists: () => true,
          data: () => ({ id, mockData: true })
        }))
      }),
      get: jasmine.createSpy('get').and.callFake(() => {
        const docs = this.collections.get(path) || [];
        return Promise.resolve({
          docs: docs.map(doc => ({
            id: doc.id,
            data: () => doc
          }))
        });
      })
    };
  }

  clearCollection(path: string) {
    this.collections.set(path, []);
  }

  clearAll() {
    this.collections.clear();
  }
}

/**
 * Create a spy object for Firestore with common methods
 */
export function createFirestoreSpy(): jasmine.SpyObj<any> {
  return jasmine.createSpyObj('Firestore', {
    collection: jasmine.createSpy('collection'),
    doc: jasmine.createSpy('doc'),
    addDoc: jasmine.createSpy('addDoc'),
    getDoc: jasmine.createSpy('getDoc'),
    getDocs: jasmine.createSpy('getDocs'),
    query: jasmine.createSpy('query'),
    where: jasmine.createSpy('where'),
    orderBy: jasmine.createSpy('orderBy'),
    limit: jasmine.createSpy('limit')
  });
}

/**
 * Mock CompetitiveResults data for testing
 */
export function createMockCompetitiveResult(overrides?: Partial<any>) {
  return {
    username: 'TestUser',
    score: 85,
    timeSpent: 120000,
    difficulty: 'all-flags',
    questionsCount: 50,
    timestamp: new Date().toISOString(),
    accuracy: 85,
    totalQuestions: 50,
    correctAnswers: 42,
    averageTimePerQuestion: 2400,
    baseRating: 850,
    speedBonus: 50,
    finalRating: 900,
    ratingTier: 'Expert',
    sessionId: `session_${Date.now()}`,
    completedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Mock PracticeResults data for testing
 */
export function createMockPracticeResult(overrides?: Partial<any>) {
  return {
    username: 'TestUser',
    flagsLearned: 26,
    practiceTime: 300000,
    timestamp: new Date().toISOString(),
    sessionId: `practice_${Date.now()}`,
    ...overrides
  };
}

/**
 * Create a mock collection reference
 */
export function createMockCollectionRef(data: any[] = []) {
  return {
    add: jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'mock_id' })),
    doc: jasmine.createSpy('doc').and.returnValue(createMockDocRef()),
    get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
      docs: data.map((item, index) => ({
        id: `doc_${index}`,
        data: () => item,
        exists: () => true
      }))
    })),
    onSnapshot: jasmine.createSpy('onSnapshot')
  };
}

/**
 * Create a mock document reference
 */
export function createMockDocRef(data: any = {}) {
  return {
    set: jasmine.createSpy('set').and.returnValue(Promise.resolve()),
    update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
    get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
      id: 'mock_id',
      exists: () => true,
      data: () => data
    })),
    onSnapshot: jasmine.createSpy('onSnapshot')
  };
}

/**
 * Wait for async operations in tests
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock query constraints
 */
export function createMockQueryConstraints() {
  return {
    where: jasmine.createSpy('where').and.returnValue({}),
    orderBy: jasmine.createSpy('orderBy').and.returnValue({}),
    limit: jasmine.createSpy('limit').and.returnValue({}),
    startAfter: jasmine.createSpy('startAfter').and.returnValue({})
  };
}

/**
 * Simulate Firestore timestamp
 */
export function createMockTimestamp(date: Date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
  };
}
