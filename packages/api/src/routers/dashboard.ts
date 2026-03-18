import prisma from "@ibs-loja/db";

import { adminProcedure, router } from "../index";

export const dashboardRouter = router({
  stats: adminProcedure.query(async () => {
    const [totalSales, totalProducts, totalSuppliers, totalUsers] =
      await Promise.all([
        prisma.sale.count(),
        prisma.product.count(),
        prisma.supplier.count(),
        prisma.user.count(),
      ]);

    const salesAggregate = await prisma.sale.aggregate({
      _sum: {
        totalValue: true,
      },
    });

    const totalSold = Number(salesAggregate._sum.totalValue ?? 0);
    const totalToSuppliers = totalSold * 0.15;

    return {
      totalSales,
      totalSold,
      totalToSuppliers,
      totalProducts,
      totalSuppliers,
      totalUsers,
    };
  }),
});

export type DashboardRouter = typeof dashboardRouter;
