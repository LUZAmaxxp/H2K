"use client";

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  size?: string;
  children: ReactNode;
}

export function Modal({ isOpen, size = "md", children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-lg p-6 max-w-${size === 'sm' ? 'sm' : 'md'} w-full mx-4`}>
        {children}
      </div>
    </div>
  );
}
