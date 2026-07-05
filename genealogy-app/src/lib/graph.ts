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
      const hNode = graph.get(husband);
      if (hNode && !hNode.spouses.includes(wife)) {
        hNode.spouses.push(wife);
      }
      const wNode = graph.get(wife);
      if (wNode && !wNode.spouses.includes(husband)) {
        wNode.spouses.push(husband);
      }
    }

    // Parents and Children
    children.forEach(child => {
      const cNode = graph.get(child);
      if (husband) {
        const hNode = graph.get(husband);
        if (hNode && !hNode.children.includes(child)) {
          hNode.children.push(child);
        }
        if (cNode && !cNode.parents.includes(husband)) {
          cNode.parents.push(husband);
        }
      }
      if (wife) {
        const wNode = graph.get(wife);
        if (wNode && !wNode.children.includes(child)) {
          wNode.children.push(child);
        }
        if (cNode && !cNode.parents.includes(wife)) {
          cNode.parents.push(wife);
        }
      }
    });
  });

  return graph;
}
