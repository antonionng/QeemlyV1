"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

interface LogoUploaderProps {
  value: string | null;
  onChange: (logo: string | null) => void;
  companyName?: string;
}

export function LogoUploader({ value, onChange, companyName = "Company" }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFile = useCallback((file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PNG, JPG, SVG, or WebP image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-6">
        {/* Logo Preview */}
        <div className="relative">
          <div
            className={clsx(
              "flex h-24 w-24 items-center justify-center rounded-2xl border-2 overflow-hidden transition-all",
              value
                ? "border-brand-200 bg-white"
                : "border-dashed border-brand-300 bg-brand-50"
            )}
          >
            {value ? (
              <img
                src={value}
                alt="Company logo"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-2xl">
                {getInitials(companyName)}
              </div>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
              aria-label="Remove logo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={clsx(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
              isDragging
                ? "border-brand-500 bg-brand-50"
                : "border-brand-200 bg-brand-50/50 hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 mb-3">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-brand-900">
              {isDragging ? "Drop your logo here" : "Upload company logo"}
            </p>
            <p className="text-xs text-brand-500 mt-1">
              PNG, JPG, SVG or WebP (max 2MB)
            </p>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <X className="h-3 w-3" />
              {error}
            </p>
          )}

          <p className="mt-3 text-xs text-brand-500">
            Your logo will appear in the sidebar, reports, and benchmark comparisons.
          </p>
        </div>
      </div>
    </div>
  );
}
