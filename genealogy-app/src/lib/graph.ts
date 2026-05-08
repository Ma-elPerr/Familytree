import { GedcomData, GedcomIndividual } from './parsers';

export interface GraphNode {
  individual: GedcomIndividual;
  parents: string[]; // IDs of parents
  children: string[]; // IDs of children
  spouses: string[]; // IDs of spouses
}

export type GenealogyGraph = Map<string, GraphNode>;

export function buildGraph(data: GedcomData): GenealogyGraph {
  const graph: GenealogyGraph = new Map();

  // Initialize nodes
  data.individuals.forEach((ind, id) => {
    graph.set(id, {
      individual: ind,
      parents: [],
      children: [],
      spouses: []
    });
  });

  // Populate edges based on families
  data.families.forEach(family => {
    const { husband, wife, children } = family;

    // Spouses
    if (husband && wife) {
      graph.get(husband)?.spouses.push(wife);
      graph.get(wife)?.spouses.push(husband);
    }

    // Parents and Children
    children.forEach(child => {
      if (husband) {
        graph.get(husband)?.children.push(child);
        graph.get(child)?.parents.push(husband);
      }
      if (wife) {
        graph.get(wife)?.children.push(child);
        graph.get(child)?.parents.push(wife);
      }
    });
  });

  // Remove duplicates from arrays just in case
  graph.forEach(node => {
    node.parents = Array.from(new Set(node.parents));
    node.children = Array.from(new Set(node.children));
    node.spouses = Array.from(new Set(node.spouses));
  });

  return graph;
}
