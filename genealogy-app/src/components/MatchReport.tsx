'use client';

import React from 'react';
import { MatchResult } from '@/lib/algorithms';
import { GenealogyGraph } from '@/lib/graph';

interface MatchReportProps {
  matches: MatchResult[];
  graph: GenealogyGraph;
}

export default function MatchReport({ matches, graph }: MatchReportProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Relatório de Cruzamento DNA x Árvore</h2>

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
            {matches.sort((a, b) => b.dnaMatch.cM - a.dnaMatch.cM).map((match, idx) => (
              <tr key={idx} className={match.status === 'Localizado' ? 'bg-green-50/50' : ''}>
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
