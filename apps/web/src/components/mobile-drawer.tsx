"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { X } from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "ADMIN" | "SELLER";
}

export function MobileDrawer({ isOpen, onClose, userRole }: MobileDrawerProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 h-full flex">
        <div className="relative flex flex-col bg-sidebar border-r">
          <div className="p-3 border-b flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-bold flex-1 text-center">IBS Loja</h1>
            <div className="w-6" />
          </div>
          <Sidebar userRole={userRole} showHeader={false} />
        </div>
      </div>
    </div>
  );
}
