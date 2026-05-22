import { describe, it, expect, vi } from 'vitest';
import Papa, { ParseConfig } from 'papaparse';
import { parseCSV } from '../parsers';

vi.mock('papaparse', () => {
  return {
    default: {
      parse: vi.fn(),
    },
  };
});

describe('parsers', () => {
  describe('parseCSV', () => {
    it('should successfully parse a valid CSV File', async () => {
      const mockFile = new File(['Name,cM\nJohn Doe,50'], 'test.csv', { type: 'text/csv' });

      const parseSpy = vi.spyOn(Papa, 'parse').mockImplementation((file, options?: ParseConfig) => {
        if (options && options.complete) {
          options.complete({
            data: [
              { 'Name': 'John Doe', 'cM': '50' }
            ],
            errors: [],
            meta: { delimiter: ',', linebreak: '\n', aborted: false, truncated: false }
          }, file as File);
        }
        return undefined as unknown as Papa.ParseResult<unknown>;
      });

      const result = await parseCSV(mockFile);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'John Doe', cM: 50, treeLink: undefined });

      parseSpy.mockRestore();
    });

    it('should correctly reject the Promise when Papa.parse encounters an error', async () => {
      const mockFile = new File(['invalid data'], 'error.csv', { type: 'text/csv' });
      const testError = new Error('Simulated parsing error');

      const parseSpy = vi.spyOn(Papa, 'parse').mockImplementation((file, options?: ParseConfig) => {
        if (options && options.error) {
          options.error(testError as unknown as Papa.ParseError, file as File);
        }
        return undefined as unknown as Papa.ParseResult<unknown>;
      });

      await expect(parseCSV(mockFile)).rejects.toThrow('Simulated parsing error');

      parseSpy.mockRestore();
    });
  });
});
