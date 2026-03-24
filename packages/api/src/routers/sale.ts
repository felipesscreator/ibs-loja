import { TRPCError } from "@trpc/server";
import prisma from "@ibs-loja/db";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const COMMISSION_RATE = 0.15;

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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sale not found",
        });
      }

      if (ctx.userRole !== "ADMIN" && sale.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return sale;
    }),

  calculate: protectedProcedure
    .input(calculateSaleSchema)
    .mutation(async ({ input }) => {
      const productIds = input.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalValue = 0;
      const itemsWithPrice: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        itemTotal: number;
      }[] = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product not found`,
          });
        }
        const itemTotal = Number(product.price) * item.quantity;
        totalValue += itemTotal;
        itemsWithPrice.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: Number(product.price),
          itemTotal,
        });
      }

      return {
        items: itemsWithPrice,
        totalValue,
        totalToSuppliers: totalValue * COMMISSION_RATE,
      };
    }),

  create: protectedProcedure
    .input(createSaleSchema)
    .mutation(async ({ ctx, input }) => {
      const productIds = input.items.map((item) => item.productId);

      const sale = await prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));
        let totalValue = 0;
        const saleItems: {
          productId: string;
          quantity: number;
          unitPrice: number;
        }[] = [];

        for (const item of input.items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Product not found",
            });
          }

          if (product.amount < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient stock for ${product.name}`,
            });
          }

          const itemTotal = Number(product.price) * item.quantity;
          totalValue += itemTotal;

          saleItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(product.price),
          });
        }

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
                unitPrice: item.unitPrice,
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
        totalToSuppliers: Number(sale.totalValue) * COMMISSION_RATE,
      };
    }),
});

export type SaleRouter = typeof saleRouter;
