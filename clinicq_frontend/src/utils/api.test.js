import { firstFromListResponse, unwrapListResponse } from './api';

describe('unwrapListResponse', () => {
  it('returns the payload when it is already an array', () => {
    expect(unwrapListResponse([1, 2])).toEqual([1, 2]);
  });

  it('returns results when payload contains a paginated structure', () => {
    expect(unwrapListResponse({ results: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('returns an empty array for unsupported payloads', () => {
    expect(unwrapListResponse(null)).toEqual([]);
    expect(unwrapListResponse({})).toEqual([]);
  });
});

describe('firstFromListResponse', () => {
  it('returns the first item from an array payload', () => {
    expect(firstFromListResponse([3, 4])).toBe(3);
  });

  it('returns the first item from a paginated payload', () => {
    expect(firstFromListResponse({ results: ['x', 'y'] })).toBe('x');
  });

  it('returns null when the payload has no items', () => {
    expect(firstFromListResponse([])).toBeNull();
    expect(firstFromListResponse({ results: [] })).toBeNull();
    expect(firstFromListResponse(undefined)).toBeNull();
  });
});
