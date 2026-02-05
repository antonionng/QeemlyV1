"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { UploadWizard } from "./upload-wizard";
import { useUploadStore, type UploadDataType } from "@/lib/upload";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: UploadDataType;
  onSuccess?: () => void;
};

export function UploadModal({ isOpen, onClose, type, onSuccess }: UploadModalProps) {
  const { reset } = useUploadStore();

  // Reset store when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
        <UploadWizard
          mode="modal"
          preselectedType={type}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );

  // Render modal in portal
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
