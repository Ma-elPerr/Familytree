import { describe, it, expect } from 'vitest';
import { matchDNA } from './algorithms';

describe('matchDNA', () => {
  it('should safely return an empty array when given an empty dataset', () => {
    const result = matchDNA([], new Map());
    expect(result).toEqual([]);
  });
});
