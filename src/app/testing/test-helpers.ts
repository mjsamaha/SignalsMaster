import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Query helper for finding elements in component tests
 */
export class QueryHelper {
  constructor(private fixture: ComponentFixture<any>) {}

  /**
   * Find element by CSS selector
   */
  query(selector: string): DebugElement | null {
    return this.fixture.debugElement.query(By.css(selector));
  }

  /**
   * Find all elements by CSS selector
   */
  queryAll(selector: string): DebugElement[] {
    return this.fixture.debugElement.queryAll(By.css(selector));
  }

  /**
   * Find element by text content
   */
  queryByText(text: string): DebugElement | null {
    const elements = this.fixture.debugElement.queryAll(By.css('*'));
    return elements.find(el => el.nativeElement.textContent?.includes(text)) || null;
  }

  /**
   * Find button by text
   */
  button(text: string): DebugElement | null {
    const buttons = this.queryAll('button, ion-button');
    return buttons.find(btn => btn.nativeElement.textContent?.includes(text)) || null;
  }

  /**
   * Find input by placeholder
   */
  inputByPlaceholder(placeholder: string): DebugElement | null {
    const inputs = this.queryAll('input, ion-input');
    return inputs.find(input =>
      input.nativeElement.placeholder?.includes(placeholder) ||
      input.nativeElement.getAttribute('placeholder')?.includes(placeholder)
    ) || null;
  }

  /**
   * Click an element
   */
  click(selector: string | DebugElement): void {
    const element = typeof selector === 'string' ? this.query(selector) : selector;
    if (element) {
      element.nativeElement.click();
      this.fixture.detectChanges();
    }
  }

  /**
   * Type text into input
   */
  typeText(selector: string | DebugElement, text: string): void {
    const element = typeof selector === 'string' ? this.query(selector) : selector;
    if (element) {
      const input = element.nativeElement;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      this.fixture.detectChanges();
    }
  }

  /**
   * Get text content of element
   */
  text(selector: string | DebugElement): string {
    const element = typeof selector === 'string' ? this.query(selector) : selector;
    return element?.nativeElement.textContent?.trim() || '';
  }

  /**
   * Check if element exists
   */
  exists(selector: string): boolean {
    return this.query(selector) !== null;
  }

  /**
   * Check if element is visible
   */
  isVisible(selector: string): boolean {
    const element = this.query(selector);
    if (!element) return false;

    const nativeElement = element.nativeElement;
    return !!(
      nativeElement.offsetWidth ||
      nativeElement.offsetHeight ||
      nativeElement.getClientRects().length
    );
  }
}

/**
 * Create query helper for a fixture
 */
export function createQueryHelper(fixture: ComponentFixture<any>): QueryHelper {
  return new QueryHelper(fixture);
}

/**
 * Trigger change detection and wait
 */
export async function detectChangesAndWait(fixture: ComponentFixture<any>, ms: number = 0): Promise<void> {
  fixture.detectChanges();
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dispatch a custom event
 */
export function dispatchEvent(element: HTMLElement, eventName: string, eventData?: any): void {
  const event = new CustomEvent(eventName, {
    detail: eventData,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    return Array.from(this.storage.keys())[index] || null;
  }
}

/**
 * Mock window.matchMedia for responsive tests
 */
export function mockMatchMedia(matches: boolean = true): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jasmine.createSpy('matchMedia').and.returnValue({
      matches,
      media: '(min-width: 768px)',
      onchange: null,
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent')
    })
  });
}
