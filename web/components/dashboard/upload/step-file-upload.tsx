"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  ArrowRight,
  Download,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  useUploadStore,
  parseFile,
  formatFileSize,
  detectColumnMappings,
  downloadTemplate,
} from "@/lib/upload";

export function StepFileUpload() {
  const { dataType, file, setFile, setMappings, nextStep } = useUploadStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!dataType) return;

      setIsProcessing(true);
      setError(null);

      const result = await parseFile(selectedFile);

      if (!result.success || !result.data) {
        setError(result.error || "Failed to parse file");
        setIsProcessing(false);
        return;
      }

      // Auto-detect column mappings
      const mappings = detectColumnMappings(
        result.data.headers,
        dataType,
        result.data.rows.slice(0, 5)
      );

      setFile(result.data);
      setMappings(mappings);
      setIsProcessing(false);
    },
    [dataType, setFile, setMappings]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  const handleClearFile = () => {
    setFile(null as any);
    setMappings([]);
    setError(null);
  };

  const handleContinue = () => {
    if (file) {
      nextStep();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">Upload your file</h2>
        <p className="text-sm text-brand-600 mt-1">
          Drag and drop a CSV or Excel file, or click to browse
        </p>
      </div>

      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all",
            isDragging
              ? "border-brand-500 bg-brand-50"
              : "border-brand-200 hover:border-brand-400 hover:bg-brand-50/50",
            isProcessing && "pointer-events-none opacity-50"
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isProcessing}
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 mb-4">
            {isProcessing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            ) : (
              <Upload className="h-7 w-7 text-brand-600" />
            )}
          </div>

          <p className="text-sm font-medium text-brand-900 mb-1">
            {isProcessing ? "Processing file..." : "Drop your file here"}
          </p>
          <p className="text-xs text-brand-600 mb-4">
            or click to browse from your computer
          </p>

          <div className="flex items-center gap-2 text-xs text-brand-500">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Supports CSV and Excel (.xlsx, .xls)</span>
          </div>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-brand-900">{file.fileName}</p>
                <div className="flex items-center gap-2 text-sm text-brand-600">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>{file.rowCount} rows</span>
                  <span>•</span>
                  <span>{file.headers.length} columns</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Column preview */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-brand-700 mb-2">Detected columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {file.headers.map((header, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error parsing file</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Template download */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-brand-50 border border-brand-200 p-4">
        <div>
          <p className="text-sm font-medium text-brand-900">Need a template?</p>
          <p className="text-xs text-brand-600 mt-0.5">
            Download our template with the correct format and sample data
          </p>
        </div>
        <button
          onClick={() => dataType && downloadTemplate(dataType)}
          className="flex items-center gap-1.5 rounded-lg bg-white border border-brand-300 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download template
        </button>
      </div>

      {/* Continue button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!file}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            file
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
