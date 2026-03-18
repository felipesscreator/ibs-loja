import prisma from "@ibs-loja/db";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const saleIdSchema = z.string();

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
});

const calculateSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
});

export const saleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const where =
      ctx.userRole === "ADMIN" ? {} : { userId: ctx.session.user.id };

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return sales;
  }),

  getById: protectedProcedure
    .input(saleIdSchema)
    .query(async ({ ctx, input }) => {
      const sale = await prisma.sale.findUnique({
        where: { id: input },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      if (ctx.userRole !== "ADMIN" && sale.userId !== ctx.session.user.id) {
        throw new Error("Access denied");
      }

      return sale;
    }),

  calculate: protectedProcedure
    .input(calculateSaleSchema)
    .mutation(async ({ input }) => {
      let totalValue = 0;
      const itemsWithPrice: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: unknown;
        itemTotal: number;
      }[] = [];

      for (const item of input.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        const itemTotal = Number(product.price) * item.quantity;
        totalValue += itemTotal;
        itemsWithPrice.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          itemTotal,
        });
      }

      return {
        items: itemsWithPrice,
        totalValue,
        totalToSuppliers: totalValue * 0.15,
      };
    }),

  create: protectedProcedure
    .input(createSaleSchema)
    .mutation(async ({ ctx, input }) => {
      let totalValue = 0;
      const saleItems: {
        productId: string;
        quantity: number;
        unitPrice: unknown;
      }[] = [];

      for (const item of input.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.amount < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.amount}, Requested: ${item.quantity}`,
          );
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalValue += itemTotal;

        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const sale = await prisma.$transaction(async (tx) => {
        for (const item of saleItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              amount: {
                decrement: item.quantity,
              },
            },
          });
        }

        return tx.sale.create({
          data: {
            userId: ctx.session.user.id,
            totalValue,
            items: {
              create: saleItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice as `Decimal`,
              })),
            },
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        });
      });

      return {
        ...sale,
        totalToSuppliers: totalValue * 0.15,
      };
    }),
});

export type SaleRouter = typeof saleRouter;
