import levenshtein from 'fast-levenshtein';
import { GenealogyGraph } from './graph';
import { DNAMatch } from './parsers';

export interface MatchResult {
  dnaMatch: DNAMatch;
  matchedIndividualId?: string;
  matchedIndividualName?: string;
  status: 'Localizado' | 'Não Localizado';
  mrcaId?: string;
  mrcaName?: string;
  pathToMrca?: string[]; // Array of IDs
  distance?: number;
}

// Helper to normalize names for comparison
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

export function matchDNA(dnaMatches: DNAMatch[], graph: GenealogyGraph): MatchResult[] {
  const results: MatchResult[] = [];
  const individuals = Array.from(graph.values());

  for (const match of dnaMatches) {
    const normMatchName = normalizeName(match.name);
    let bestMatchId: string | undefined;
    let bestMatchName: string | undefined;
    let minDistance = Infinity;

    for (const node of individuals) {
      const normGraphName = normalizeName(node.individual.name);

      // Simple exact match
      if (normMatchName === normGraphName || normGraphName.includes(normMatchName) || normMatchName.includes(normGraphName)) {
        bestMatchId = node.individual.id;
        bestMatchName = node.individual.name;
        minDistance = 0;
        break;
      }

      // Levenshtein distance for fuzzy matching
      const distance = levenshtein.get(normMatchName, normGraphName);
      // Threshold: allow small typos, max 3 edits for long names
      const threshold = Math.max(3, Math.floor(normMatchName.length * 0.2));

      if (distance <= threshold && distance < minDistance) {
        minDistance = distance;
        bestMatchId = node.individual.id;
        bestMatchName = node.individual.name;
      }
    }

    results.push({
      dnaMatch: match,
      matchedIndividualId: bestMatchId,
      matchedIndividualName: bestMatchName,
      status: bestMatchId ? 'Localizado' : 'Não Localizado'
    });
  }

  return results;
}

// Returns a map of ancestor ID -> path from startNode to ancestor
function getAncestors(graph: GenealogyGraph, startNodeId: string): Map<string, string[]> {
  const ancestors = new Map<string, string[]>();
  const queue: { id: string, path: string[] }[] = [{ id: startNodeId, path: [startNodeId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    const node = graph.get(id);
    if (!node) continue;

    for (const parentId of node.parents) {
      if (!ancestors.has(parentId)) {
        const newPath = [...path, parentId];
        ancestors.set(parentId, newPath);
        queue.push({ id: parentId, path: newPath });
      }
    }
  }

  return ancestors;
}

export function findMRCA(graph: GenealogyGraph, rootNodeId: string, targetNodeId: string): { mrcaId?: string, mrcaName?: string, path1?: string[], path2?: string[] } | null {
  if (rootNodeId === targetNodeId) {
     return { mrcaId: rootNodeId, mrcaName: graph.get(rootNodeId)?.individual.name, path1: [rootNodeId], path2: [targetNodeId] };
  }

  const rootAncestors = getAncestors(graph, rootNodeId);
  const targetAncestors = getAncestors(graph, targetNodeId);

  // Root is an ancestor of target
  if (targetAncestors.has(rootNodeId)) {
      return {
          mrcaId: rootNodeId,
          mrcaName: graph.get(rootNodeId)?.individual.name,
          path1: [rootNodeId],
          path2: targetAncestors.get(rootNodeId)
      };
  }

  // Target is an ancestor of root
  if (rootAncestors.has(targetNodeId)) {
      return {
          mrcaId: targetNodeId,
          mrcaName: graph.get(targetNodeId)?.individual.name,
          path1: rootAncestors.get(targetNodeId),
          path2: [targetNodeId]
      };
  }

  let bestMRCA: string | undefined;
  let minTotalDistance = Infinity;

  // Find intersection
  for (const [ancestorId, pathFromRoot] of rootAncestors.entries()) {
    if (targetAncestors.has(ancestorId)) {
      const pathFromTarget = targetAncestors.get(ancestorId)!;
      const totalDist = pathFromRoot.length + pathFromTarget.length;

      if (totalDist < minTotalDistance) {
        minTotalDistance = totalDist;
        bestMRCA = ancestorId;
      }
    }
  }

  if (bestMRCA) {
    return {
      mrcaId: bestMRCA,
      mrcaName: graph.get(bestMRCA)?.individual.name,
      path1: rootAncestors.get(bestMRCA),
      path2: targetAncestors.get(bestMRCA)
    };
  }

  return null;
}

export function processMatches(dnaMatches: DNAMatch[], graph: GenealogyGraph, rootNodeId?: string): MatchResult[] {
  const matches = matchDNA(dnaMatches, graph);

  if (rootNodeId && graph.has(rootNodeId)) {
    for (const match of matches) {
      if (match.matchedIndividualId) {
        const mrcaInfo = findMRCA(graph, rootNodeId, match.matchedIndividualId);
        if (mrcaInfo) {
          match.mrcaId = mrcaInfo.mrcaId;
          match.mrcaName = mrcaInfo.mrcaName;
          // Construct the full path: from target up to MRCA, then down to root
          if (mrcaInfo.path1 && mrcaInfo.path2) {
              // path1 is root to MRCA. path2 is target to MRCA.
              match.pathToMrca = mrcaInfo.path2;
          }
        }
      }
    }
  }

  return matches;
}
