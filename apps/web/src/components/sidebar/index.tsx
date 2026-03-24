"use client";

import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ShoppingCart,
  Receipt,
} from "lucide-react";

interface SidebarContentProps {
  userRole?: "ADMIN" | "SELLER";
}

export function SidebarContent({ userRole = "SELLER" }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Usuários", icon: Users },
    { href: "/suppliers", label: "Fornecedores", icon: Truck },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/sales", label: "Vendas", icon: Receipt },
  ];

  const commonLinks = [{ href: "/pos", label: "Nova Venda", icon: ShoppingCart }];

  const links = userRole === "ADMIN" ? [...adminLinks, ...commonLinks] : commonLinks;

  return (
    <>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={`w-full justify-start gap-2 ${isActive ? "bg-accent" : ""}`}
              onClick={() => router.push(link.href as Parameters<typeof router.push>[0])}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-2 border-t">
        <div className="flex items-center justify-between">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </>
  );
}

interface SidebarProps {
  userRole?: "ADMIN" | "SELLER";
  showHeader?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userRole = "SELLER", showHeader = true, onClose }: SidebarProps) {
  return (
    <div className="flex flex-col w-56 h-full bg-sidebar border-r">
      {showHeader && (
        <div className="p-3 border-b">
          <h1 className="text-lg font-bold text-center">IBS Loja</h1>
        </div>
      )}
      <SidebarContent userRole={userRole} />
    </div>
  );
}
