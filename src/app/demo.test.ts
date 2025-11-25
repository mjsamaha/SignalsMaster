/**
 * Demo Unit Test for Jest
 * 
 * Simple test to demonstrate the test automation workflow.
 * This validates that Jest is properly configured and working.
 */

describe('Test Infrastructure', () => {
  it('should have Jest configured and working', () => {
    expect(true).toBe(true);
  });

  it('should support basic JavaScript assertions', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(2, 3)).toBe(5);
  });

  it('should support async operations', async () => {
    const fetchData = async () => Promise.resolve('data');
    const result = await fetchData();
    expect(result).toBe('data');
  });

  it('should support mocking', () => {
    const mockFn = jest.fn(() => 'mocked value');
    expect(mockFn()).toBe('mocked value');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
