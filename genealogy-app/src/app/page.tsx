'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import MatchReport from '@/components/MatchReport';
import FloatingTrees from '@/components/FloatingTrees';
import DuplicatesReport from '@/components/DuplicatesReport';
import { parseGedcom, parseCSV } from '@/lib/parsers';
import { buildGraph, GenealogyGraph } from '@/lib/graph';
import { processMatches, MatchResult } from '@/lib/algorithms';
import { findFloatingTrees, findDuplicates, FloatingTree, DuplicateGroup } from '@/lib/analysis';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [graph, setGraph] = useState<GenealogyGraph | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [floatingTrees, setFloatingTrees] = useState<FloatingTree[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  const handleProcessFiles = async (gedcomFile: File, csvFile: File, rootPersonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      if (gedcomFile?.size > MAX_FILE_SIZE) {
        throw new Error('O arquivo GEDCOM excede o tamanho máximo permitido de 50MB.');
      }
      if (csvFile?.size > MAX_FILE_SIZE) {
        throw new Error('O arquivo CSV excede o tamanho máximo permitido de 50MB.');
      }

      // 1. Parse GEDCOM
      const gedcomText = await gedcomFile.text();
      const gedcomData = await parseGedcom(gedcomText);

      // 2. Build Graph
      const g = buildGraph(gedcomData);
      setGraph(g);

      // 3. Parse CSV
      const dnaMatches = await parseCSV(csvFile);

      // 4. Match and Find MRCA
      const matchResults = processMatches(dnaMatches, g, rootPersonId);
      setMatches(matchResults);

      // 5. Analysis: Floating Trees and Duplicates
      const trees = findFloatingTrees(g, rootPersonId, matchResults);
      setFloatingTrees(trees);

      const dups = findDuplicates(g);
      setDuplicates(dups);

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || 'Ocorreu um erro ao processar os arquivos.');
      } else {
        setError('Ocorreu um erro ao processar os arquivos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Genealogy Engine
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Caso Patrícia Perrucci — Cruzamento de DNA e Árvore Genealógica (GEDCOM)</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <FileUpload onFilesUploaded={handleProcessFiles} />

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && graph && (
          <>
            <MatchReport matches={matches} graph={graph} />
            <FloatingTrees trees={floatingTrees} graph={graph} />
            <DuplicatesReport duplicates={duplicates} />
          </>
        )}
      </main>
    </div>
  );
}
