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
function getAncestors(graph: GenealogyGraph, startNodeId: string): Map<string, string> {
  const parentMap = new Map<string, string>();
  const queue: string[] = [startNodeId];
  let head = 0;

  while (head < queue.length) {
    const id = queue[head++];

    const node = graph.get(id);
    if (!node) continue;

    for (const parentId of node.parents) {
      if (!parentMap.has(parentId) && parentId !== startNodeId) {
        parentMap.set(parentId, id);
        queue.push(parentId);
      }
    }
  }

  return parentMap;
}

function reconstructPath(parentMap: Map<string, string>, startNodeId: string, targetNodeId: string): string[] {
  const path: string[] = [];
  let curr: string | undefined = targetNodeId;
  while (curr !== undefined && curr !== startNodeId) {
    path.push(curr);
    curr = parentMap.get(curr);
  }
  path.push(startNodeId);
  return path.reverse();
}

function getDepth(parentMap: Map<string, string>, startNodeId: string, nodeId: string): number {
  let depth = 0;
  let curr: string | undefined = nodeId;
  while (curr !== undefined && curr !== startNodeId) {
    depth++;
    curr = parentMap.get(curr);
  }
  return depth;
}

export function findMRCA(graph: GenealogyGraph, rootNodeId: string, targetNodeId: string): { mrcaId?: string, mrcaName?: string, path1?: string[], path2?: string[] } {
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
          path2: reconstructPath(targetAncestors, targetNodeId, rootNodeId)
      };
  }

  // Target is an ancestor of root
  if (rootAncestors.has(targetNodeId)) {
      return {
          mrcaId: targetNodeId,
          mrcaName: graph.get(targetNodeId)?.individual.name,
          path1: reconstructPath(rootAncestors, rootNodeId, targetNodeId),
          path2: [targetNodeId]
      };
  }

  let bestMRCA: string | undefined;
  let minTotalDistance = Infinity;

  // Find intersection
  for (const ancestorId of rootAncestors.keys()) {
    if (targetAncestors.has(ancestorId)) {
      const distFromRoot = getDepth(rootAncestors, rootNodeId, ancestorId);
      const distFromTarget = getDepth(targetAncestors, targetNodeId, ancestorId);
      const totalDist = distFromRoot + distFromTarget;

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
      path1: reconstructPath(rootAncestors, rootNodeId, bestMRCA),
      path2: reconstructPath(targetAncestors, targetNodeId, bestMRCA)
    };
  }

  return {};
}

export function processMatches(dnaMatches: DNAMatch[], graph: GenealogyGraph, rootNodeId?: string): MatchResult[] {
  const matches = matchDNA(dnaMatches, graph);

  if (rootNodeId && graph.has(rootNodeId)) {
    for (const match of matches) {
      if (match.matchedIndividualId) {
        const mrcaInfo = findMRCA(graph, rootNodeId, match.matchedIndividualId);
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

  return matches;
}
