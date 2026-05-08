'use client';

import React from 'react';
import { FloatingTree } from '@/lib/analysis';
import { GenealogyGraph } from '@/lib/graph';
import { AlertTriangle } from 'lucide-react';

interface FloatingTreesProps {
  trees: FloatingTree[];
  graph: GenealogyGraph;
}

export default function FloatingTrees({ trees, graph }: FloatingTreesProps) {
  if (!trees || trees.length === 0) return null;

  // Sort: ones with DNA match first, then by size
  const sortedTrees = [...trees].sort((a, b) => {
    if (a.hasDNAMatch && !b.hasDNAMatch) return -1;
    if (!a.hasDNAMatch && b.hasDNAMatch) return 1;
    return b.size - a.size;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Árvores Flutuantes (Ilhas)</h2>
      <p className="text-sm text-gray-600 mb-6">
        Estes são sub-grafos desconectados da árvore principal. Se um Match de DNA estiver aqui, é uma pista importante.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTrees.map((tree, idx) => {
          const repNode = graph.get(tree.id);
          const repName = repNode?.individual.name || tree.id;

          return (
            <div
              key={idx}
              className={`p-5 rounded-lg border transition-shadow hover:shadow-md ${tree.hasDNAMatch ? 'bg-yellow-50/80 border-yellow-300' : 'bg-gray-50/80 border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Ilha {idx + 1}</h3>
                  <p className="text-sm text-gray-600">{tree.size} pessoas</p>
                </div>
                {tree.hasDNAMatch && (
                  <AlertTriangle className="text-yellow-600 h-5 w-5" />
                )}
              </div>

              <div className="mt-3 text-sm">
                <span className="text-gray-500">Patriarca/Matriarca:</span><br/>
                <span className="font-medium text-gray-800">{repName}</span>
              </div>

              {tree.hasDNAMatch && (
                <div className="mt-4 pt-3 border-t border-yellow-200">
                  <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider block mb-1">
                    Atenção: Matches Encontrados
                  </span>
                  <ul className="list-disc pl-4 text-sm text-yellow-900">
                    {tree.dnaMatches.map((m, mIdx) => (
                      <li key={mIdx}>{m}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2">
                    Sugestão: Investigar conexão desta árvore com as famílias principais.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
