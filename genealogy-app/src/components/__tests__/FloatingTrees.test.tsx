import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FloatingTrees from '../FloatingTrees';
import { FloatingTree } from '@/lib/analysis';
import { GenealogyGraph } from '@/lib/graph';

// Mock the AlertTriangle icon
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />
}));

describe('FloatingTrees', () => {
  const mockGraph: GenealogyGraph = new Map([
    ['I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    }],
    ['I2', {
      individual: { id: 'I2', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' },
      parents: [], children: [], spouses: []
    }],
    ['I3', {
      individual: { id: 'I3', name: 'Bob Brown', givenName: 'Bob', surname: 'Brown' },
      parents: [], children: [], spouses: []
    }]
  ]);

  it('renders nothing when trees array is empty', () => {
    const { container } = render(<FloatingTrees trees={[]} graph={mockGraph} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when trees prop is null/undefined', () => {
    // @ts-expect-error Testing invalid props
    const { container } = render(<FloatingTrees trees={null} graph={mockGraph} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders floating trees correctly', () => {
    const trees: FloatingTree[] = [
      { id: 'I1', size: 5, members: ['I1', 'I4'], hasDNAMatch: false, dnaMatches: [] }
    ];

    render(<FloatingTrees trees={trees} graph={mockGraph} />);

    expect(screen.getByText('3. Árvores Flutuantes (Ilhas)')).toBeInTheDocument();
    expect(screen.getByText('Ilha 1')).toBeInTheDocument();
    expect(screen.getByText('5 pessoas')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
  });

  it('identifies and styles trees with DNA matches', () => {
    const trees: FloatingTree[] = [
      { id: 'I2', size: 3, members: ['I2'], hasDNAMatch: true, dnaMatches: ['DNA Match 1', 'DNA Match 2'] }
    ];

    render(<FloatingTrees trees={trees} graph={mockGraph} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    expect(screen.getByText('DNA Match 1')).toBeInTheDocument();
    expect(screen.getByText('DNA Match 2')).toBeInTheDocument();
  });

  it('sorts trees: DNA matches first, then by size descending', () => {
    const trees: FloatingTree[] = [
      { id: 'I1', size: 10, members: [], hasDNAMatch: false, dnaMatches: [] }, // Size 10, no DNA
      { id: 'I2', size: 5, members: [], hasDNAMatch: true, dnaMatches: ['M1'] }, // Size 5, DNA
      { id: 'I3', size: 20, members: [], hasDNAMatch: false, dnaMatches: [] }, // Size 20, no DNA
      { id: 'I4', size: 15, members: [], hasDNAMatch: true, dnaMatches: ['M2'] }, // Size 15, DNA
    ];

    // Extended graph, without I4 to test fallback ID behavior
    const extendedGraph = new Map(mockGraph);

    render(<FloatingTrees trees={trees} graph={extendedGraph} />);

    const islands = screen.getAllByRole('heading', { level: 3 });
    expect(islands).toHaveLength(4);

    // After sorting:
    // 1. I4 (DNA, size 15)
    // 2. I2 (DNA, size 5)
    // 3. I3 (no DNA, size 20)
    // 4. I1 (no DNA, size 10)

    const sizes = screen.getAllByText(/pessoas/);
    expect(sizes[0]).toHaveTextContent('15 pessoas');
    expect(sizes[1]).toHaveTextContent('5 pessoas');
    expect(sizes[2]).toHaveTextContent('20 pessoas');
    expect(sizes[3]).toHaveTextContent('10 pessoas');

    // Verify fallback to ID when representative node not in graph
    expect(screen.getByText('I4')).toBeInTheDocument();
  });
});
