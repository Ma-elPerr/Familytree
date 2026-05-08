'use client';

import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (gedcomFile: File, csvFile: File, rootPersonId: string) => void;
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [gedcomFile, setGedcomFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [rootPersonId, setRootPersonId] = useState<string>('@I1@');

  const handleProcess = () => {
    if (gedcomFile && csvFile && rootPersonId) {
      onFilesUploaded(gedcomFile, csvFile, rootPersonId);
    } else {
      alert("Por favor, selecione ambos os arquivos e defina o ID da pessoa raiz.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Upload de Dados</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* GEDCOM Upload */}
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${gedcomFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
          <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${gedcomFile ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 mb-2 font-medium">{gedcomFile ? 'GEDCOM Carregado' : 'Arquivo GEDCOM (.ged)'}</p>
          <input
            type="file"
            accept=".ged"
            onChange={(e) => setGedcomFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
          />
          {gedcomFile && <p className="mt-3 text-xs font-semibold text-green-700">✓ {gedcomFile.name}</p>}
        </div>

        {/* CSV Upload */}
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${csvFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
          <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${csvFile ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 mb-2 font-medium">{csvFile ? 'CSV Carregado' : 'Matches de DNA (.csv)'}</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
          />
          {csvFile && <p className="mt-3 text-xs font-semibold text-green-700">✓ {csvFile.name}</p>}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">ID da Pessoa Raiz (Patrícia Perrucci)</label>
        <input
          type="text"
          value={rootPersonId}
          onChange={(e) => setRootPersonId(e.target.value)}
          placeholder="Ex: @I1@"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">O ID GEDCOM da pessoa principal a partir da qual o caminho será traçado (Padrão: @I1@).</p>
      </div>

      <button
        onClick={handleProcess}
        disabled={!gedcomFile || !csvFile}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow text-base font-bold text-white bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Processar e Cruzar Dados
      </button>
    </div>
  );
}
