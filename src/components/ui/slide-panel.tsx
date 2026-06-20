"use client";

import * as React from "react";
import { X } from "lucide-react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function SlidePanel({ isOpen, onClose, title, children, width = "w-[600px]" }: SlidePanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 bottom-0 ${width} bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-200 ease-in-out border-l border-gray-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#F9FAFB]">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
          {children}
        </div>
      </div>
    </>
  );
}
