'use client';

import React, { useState } from 'react';
import { FileText, Upload, Check, File, Sparkles, Loader2 } from 'lucide-react';
import { uploadDocumentApi } from '../lib/api';

export const DocStudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [docResult, setDocResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const res = await uploadDocumentApi(file);
      setDocResult(res);
    } catch (e) {
      alert('Error uploading document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-spidy-dark overflow-y-auto max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-spidy-red/20 text-spidy-crimson border border-spidy-red/40">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Document AI Studio (RAG)
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Upload PDF, DOCX, CSV, Excel, or PowerPoint files for instant summarization & Q&A.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel p-8 rounded-2xl border border-dashed border-spidy-border text-center space-y-4">
        <Upload className="w-10 h-10 text-spidy-crimson mx-auto animate-bounce" />
        <div>
          <h3 className="font-bold text-base text-white">Choose a document to upload</h3>
          <p className="text-xs text-gray-400">Supports PDF, DOCX, TXT, CSV, XLSX, PPTX</p>
        </div>

        <input
          type="file"
          id="doc-upload"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls,.pptx"
        />

        <div className="flex items-center justify-center gap-3">
          <label
            htmlFor="doc-upload"
            className="px-4 py-2.5 rounded-xl bg-spidy-surface border border-spidy-border hover:border-spidy-red text-xs text-white font-semibold cursor-pointer transition-all"
          >
            {file ? file.name : 'Select File'}
          </label>

          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl spidy-btn-primary text-xs font-semibold flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Process Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Output */}
      {docResult && (
        <div className="glass-card p-6 rounded-2xl border border-spidy-border space-y-4">
          <div className="flex items-center justify-between border-b border-spidy-border pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <File className="w-4 h-4 text-spidy-crimson" />
              {docResult.filename}
            </h3>
            <span className="text-xs text-gray-400">{(docResult.size / 1024).toFixed(1)} KB</span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-spidy-crimson uppercase tracking-wider">AI Summary</h4>
            <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">{docResult.summary}</p>
          </div>

          {docResult.preview && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Extracted Text Preview</h4>
              <pre className="p-3 rounded-xl bg-black/60 text-[11px] font-mono text-red-200 overflow-x-auto">
                {docResult.preview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
