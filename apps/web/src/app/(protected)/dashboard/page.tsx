"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, ShoppingCart, Truck, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Vendas",
      value: stats?.totalSales ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Valor Total Vendido",
      value: formatCurrency(stats?.totalSold ?? 0),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Destinado aos Fornecedores",
      value: formatCurrency(stats?.totalToSuppliers ?? 0),
      icon: Truck,
      color: "text-orange-600",
    },
    {
      title: "Total de Produtos",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Total de Fornecedores",
      value: stats?.totalSuppliers ?? 0,
      icon: Truck,
      color: "text-yellow-600",
    },
    {
      title: "Total de Usuários",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
