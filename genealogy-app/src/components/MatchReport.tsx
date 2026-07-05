'use client';

import React, { useState, useMemo } from 'react';
import { MatchResult } from '@/lib/algorithms';
import { GenealogyGraph } from '@/lib/graph';
import { Search } from 'lucide-react';

interface MatchReportProps {
  matches: MatchResult[];
  graph: GenealogyGraph;
}

export default function MatchReport({ matches, graph }: MatchReportProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const filtered = matches.filter(match => {
      const term = searchTerm.toLowerCase();
      const dnaName = match.dnaMatch.name.toLowerCase();
      const treeName = match.matchedIndividualName?.toLowerCase() || '';
      return dnaName.includes(term) || treeName.includes(term);
    });

    return [...filtered].sort((a, b) => b.dnaMatch.cM - a.dnaMatch.cM);
  }, [matches, searchTerm]);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">2. Relatório de Cruzamento DNA x Árvore</h2>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Match DNA (cM)
              </th>
              <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Status na Árvore
              </th>
              <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Ancestral Comum (MRCA)
              </th>
              <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Caminho até MRCA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMatches.map((match, idx) => (
              <tr key={idx} className={match.status === 'Localizado' ? 'bg-green-50/30 hover:bg-green-50 transition-colors' : 'hover:bg-gray-50 transition-colors'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{match.dnaMatch.name}</div>
                  <div className="text-gray-500">{match.dnaMatch.cM} cM</div>
                  {match.dnaMatch.treeLink && (
                    <a href={match.dnaMatch.treeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                      Ver Árvore
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {match.status === 'Localizado' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Localizado: {match.matchedIndividualName}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Não Localizado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {match.mrcaName ? (
                    <div className="text-gray-900 font-medium">{match.mrcaName} <span className="text-gray-500 text-xs">({match.mrcaId})</span></div>
                  ) : (
                    <div className="text-gray-400">-</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {match.pathToMrca && match.pathToMrca.length > 0 ? (
                    <div className="text-xs text-gray-600 break-words max-w-xs">
                      {match.pathToMrca.map(id => graph.get(id)?.individual.name || id).join(' ➔ ')}
                    </div>
                  ) : (
                    <div className="text-gray-400">-</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
