"use client";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Receipt, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function SalesPage() {
  const { data: sales, isLoading } = trpc.sale.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vendas</h1>

      <div className="grid gap-4">
        {sales?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma venda realizada ainda</p>
            </CardContent>
          </Card>
        ) : (
          sales?.map((sale) => (
            <Card key={sale.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">
                    Venda #{sale.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(sale.createdAt)} - {sale.user.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(sale.totalValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Detalhes da Venda #{sale.id.slice(0, 8)}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Data</p>
                            <p className="font-medium">{formatDate(sale.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vendedor</p>
                            <p className="font-medium">{sale.user.name}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-2">Itens</p>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2 font-medium">Produto</th>
                                  <th className="text-center p-2 font-medium">Qtd</th>
                                  <th className="text-right p-2 font-medium">Valor Unit.</th>
                                  <th className="text-right p-2 font-medium">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map((item) => (
                                  <tr key={item.id} className="border-t">
                                    <td className="p-2">
                                      <p className="font-medium">{item.product.name}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {item.product.code}
                                      </p>
                                    </td>
                                    <td className="p-2 text-center">{item.quantity}</td>
                                    <td className="p-2 text-right">
                                      {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                      {formatCurrency(
                                        Number(item.unitPrice) * item.quantity
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-muted border-t">
                                <tr>
                                  <td colSpan={3} className="p-2 text-right font-semibold">
                                    Total:
                                  </td>
                                  <td className="p-2 text-right font-semibold">
                                    {formatCurrency(sale.totalValue)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
