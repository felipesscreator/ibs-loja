"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-2 px-3 py-2 border-b bg-background">
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <span className="font-bold">IBS Loja</span>
    </header>
  );
}
