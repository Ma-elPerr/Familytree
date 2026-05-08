import fs from 'fs';
import { parseGedcom } from './src/lib/parsers';
import { buildGraph } from './src/lib/graph';
import { processMatches } from './src/lib/algorithms';
import { findFloatingTrees, findDuplicates } from './src/lib/analysis';

// Simplified mock CSV parser for Node environment (since papaparse requires File object in frontend)
function mockParseCSV(csvContent: string) {
  const lines = csvContent.split('\n').filter(Boolean);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      name: values[0],
      cM: parseFloat(values[1]),
      treeLink: values[2]
    };
  });
}

async function runAudit() {
  const gedcomText = fs.readFileSync('test.ged', 'utf-8');
  const csvText = fs.readFileSync('matches.csv', 'utf-8');

  console.log("=== Starting Audit ===\n");

  // 1. Parsing
  const gedcomData = await parseGedcom(gedcomText);
  console.log(`Parsed GEDCOM: ${gedcomData.individuals.size} individuals, ${gedcomData.families.size} families.`);

  const dnaMatches = mockParseCSV(csvText);
  console.log(`Parsed CSV: ${dnaMatches.length} DNA matches.`);

  // 2. Graph Construction
  const graph = buildGraph(gedcomData);
  console.log(`\nBuilt Graph with ${graph.size} nodes.`);

  // 3. Matching
  const rootPersonId = '@I1@';
  const matchResults = processMatches(dnaMatches, graph, rootPersonId);
  console.log("\n=== Match Results ===");
  matchResults.forEach(m => {
    console.log(`- ${m.dnaMatch.name} (${m.dnaMatch.cM} cM): Status: ${m.status}, Matched Node: ${m.matchedIndividualName || 'None'}, MRCA: ${m.mrcaName || 'None'}`);
  });

  // 4. Floating Trees
  const trees = findFloatingTrees(graph, rootPersonId, matchResults);
  console.log("\n=== Floating Trees ===");
  trees.forEach((t, i) => {
    console.log(`- Tree ${i + 1}: Representative ${t.id}, Size: ${t.size}, Has Match: ${t.hasDNAMatch}`);
  });

  // 5. Duplicates
  const duplicates = findDuplicates(graph);
  console.log("\n=== Duplicates ===");
  duplicates.forEach(d => {
    console.log(`- ${d.name} (Birth: ${d.birthYear}): IDs: ${d.individuals.join(', ')}`);
  });
}

runAudit().catch(console.error);
