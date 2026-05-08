import { GenealogyGraph } from './graph';
import { MatchResult } from './algorithms';

export interface FloatingTree {
  id: string; // ID of the representative node (e.g. patriarch)
  size: number;
  members: string[]; // IDs of all members in this component
  hasDNAMatch: boolean;
  dnaMatches: string[]; // Names of DNA matches present in this tree
}

export interface DuplicateGroup {
  name: string;
  birthYear?: number;
  individuals: string[]; // IDs
}

// Find all connected components in the graph
export function findFloatingTrees(graph: GenealogyGraph, mainTreeRootId?: string, matches?: MatchResult[]): FloatingTree[] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      const component: string[] = [];
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        component.push(current);

        const node = graph.get(current);
        if (node) {
          const neighbors = [...node.parents, ...node.children, ...node.spouses];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }
      components.push(component);
    }
  }

  // Filter out the main tree if a root is provided
  let floatingComponents = components;
  if (mainTreeRootId) {
    floatingComponents = components.filter(comp => !comp.includes(mainTreeRootId));
  }

  return floatingComponents.map((comp) => {
    // Basic heuristic: find someone with fewest parents as representative
    let representativeId = comp[0];
    let minParents = Infinity;

    comp.forEach(id => {
      const node = graph.get(id);
      if (node && node.parents.length < minParents) {
        minParents = node.parents.length;
        representativeId = id;
      }
    });

    // Check for DNA matches in this tree
    const dnaMatchesInTree: string[] = [];
    if (matches) {
      matches.forEach(m => {
        if (m.matchedIndividualId && comp.includes(m.matchedIndividualId)) {
          dnaMatchesInTree.push(`${m.dnaMatch.name} (${m.dnaMatch.cM} cM)`);
        }
      });
    }

    return {
      id: representativeId,
      size: comp.length,
      members: comp,
      hasDNAMatch: dnaMatchesInTree.length > 0,
      dnaMatches: dnaMatchesInTree
    };
  });
}

// Basic duplicate detection based on Name and Birth Year
export function findDuplicates(graph: GenealogyGraph): DuplicateGroup[] {
  const signatureMap = new Map<string, string[]>();

  for (const [id, node] of graph.entries()) {
    const { name, birthYear } = node.individual;
    if (!name || name === 'Unknown') continue;

    const sig = `${name.toLowerCase().trim()}|${birthYear || 'unknown'}`;
    if (!signatureMap.has(sig)) {
      signatureMap.set(sig, []);
    }
    signatureMap.get(sig)!.push(id);
  }

  const duplicates: DuplicateGroup[] = [];
  signatureMap.forEach((ids, sig) => {
    if (ids.length > 1) {
      const parts = sig.split('|');
      duplicates.push({
        name: parts[0],
        birthYear: parts[1] !== 'unknown' ? parseInt(parts[1]) : undefined,
        individuals: ids
      });
    }
  });

  return duplicates;
}
