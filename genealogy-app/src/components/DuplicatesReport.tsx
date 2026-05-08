'use client';

import React from 'react';
import { DuplicateGroup } from '@/lib/analysis';

interface DuplicatesReportProps {
  duplicates: DuplicateGroup[];
}

export default function DuplicatesReport({ duplicates }: DuplicatesReportProps) {
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">4. Possíveis Duplicatas</h2>
      <p className="text-sm text-gray-600 mb-6">
        Indivíduos com o mesmo nome e ano de nascimento. Considere mesclá-los no seu software de genealogia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {duplicates.map((dup, idx) => (
          <div key={idx} className="p-4 rounded-lg border bg-gray-50 border-gray-200">
            <h3 className="font-medium text-gray-900">{dup.name}</h3>
            <p className="text-sm text-gray-500 mb-2">Nascimento: {dup.birthYear || 'Desconhecido'}</p>

            <div className="text-xs text-gray-600">
              <span className="font-semibold block mb-1">IDs Encontrados:</span>
              <div className="flex flex-wrap gap-1">
                {dup.individuals.map(id => (
                  <span key={id} className="bg-white border border-gray-300 px-2 py-1 rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
