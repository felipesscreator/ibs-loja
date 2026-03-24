import { TRPCError } from "@trpc/server";
import prisma from "@ibs-loja/db";
import { z } from "zod";

import { adminProcedure, router } from "../index";

const productIdSchema = z.string();
const productCodeSchema = z.string();

const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(1).max(50),
  price: z.number().positive().max(999999999),
  amount: z.number().int().min(0).default(0),
  supplierId: z.string(),
});

const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  price: z.number().positive().max(999999999).optional(),
  amount: z.number().int().min(0).optional(),
  supplierId: z.string().optional(),
});

export const productRouter = router({
  list: adminProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return products;
  }),

  getById: adminProcedure.input(productIdSchema).query(async ({ input }) => {
    const product = await prisma.product.findUnique({
      where: { id: input },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
    });
    if (!product) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }
    return product;
  }),

  getByCode: adminProcedure
    .input(productCodeSchema)
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { code: input },
        include: {
          supplier: {
            select: { id: true, name: true },
          },
        },
      });
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
    }),

  create: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      const existingProduct = await prisma.product.findFirst({
        where: { code: input.code },
      });
      if (existingProduct) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Product code already exists",
        });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: input.supplierId },
      });
      if (!supplier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supplier not found",
        });
      }

      const product = await prisma.product.create({
        data: {
          name: input.name,
          code: input.code,
          price: input.price,
          amount: input.amount,
          supplierId: input.supplierId,
        },
        include: {
          supplier: {
            select: { id: true, name: true },
          },
        },
      });
      return product;
    }),

  update: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      if (data.code) {
        const existingProduct = await prisma.product.findFirst({
          where: { code: data.code, NOT: { id } },
        });
        if (existingProduct) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Product code already exists",
          });
        }
      }

      if (data.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: data.supplierId },
        });
        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier not found",
          });
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data,
        include: {
          supplier: {
            select: { id: true, name: true },
          },
        },
      });
      return product;
    }),

  delete: adminProcedure
    .input(productIdSchema)
    .mutation(async ({ input }) => {
      const saleItemCount = await prisma.saleItem.count({
        where: { productId: input },
      });

      if (saleItemCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete product with existing sales",
        });
      }

      await prisma.product.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});

export type ProductRouter = typeof productRouter;
