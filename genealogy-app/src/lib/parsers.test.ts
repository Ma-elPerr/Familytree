import { describe, it, expect, vi } from 'vitest';
import { parseCSV } from './parsers';
import Papa from 'papaparse';

// Mock papaparse
vi.mock('papaparse', () => {
  return {
    default: {
      parse: vi.fn(),
    },
  };
});

describe('parseCSV', () => {
  it('should resolve with matched data when parsing is successful', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockData = {
      data: [
        { Name: 'John Doe', 'Shared DNA': '100', Tree: 'https://example.com/tree' },
        { Name: 'Jane Smith', cM: '50' },
      ],
    };

    // Cast the mock to allow accessing the specific overload
    (Papa.parse as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce((_file: unknown, config: Papa.ParseConfig) => {
      if (config.complete) config.complete(mockData as Papa.ParseResult<unknown>, mockFile);
    });

    const result = await parseCSV(mockFile);

    expect(result).toEqual([
      { name: 'John Doe', cM: 100, treeLink: 'https://example.com/tree' },
      { name: 'Jane Smith', cM: 50, treeLink: undefined },
    ]);
  });

  it('should reject with an error when parsing fails', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockError = new Error('Failed to parse CSV');

    (Papa.parse as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce((_file: unknown, config: Papa.ParseConfig) => {
      if (config.error) config.error(mockError as Papa.ParseError, mockFile);
    });

    await expect(parseCSV(mockFile)).rejects.toThrow('Failed to parse CSV');
  });
});
