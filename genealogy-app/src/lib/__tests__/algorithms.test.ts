import { describe, it, expect } from 'vitest';
import { matchDNA } from '../algorithms';
import { GenealogyGraph } from '../graph';

describe('matchDNA', () => {
  it('should return an empty array if dnaMatches is empty', () => {
    const graph: GenealogyGraph = new Map();
    const result = matchDNA([], graph);
    expect(result).toEqual([]);
  });
});
