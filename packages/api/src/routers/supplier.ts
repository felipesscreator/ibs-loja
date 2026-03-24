import { TRPCError } from "@trpc/server";
import prisma from "@ibs-loja/db";
import { z } from "zod";

import { adminProcedure, router } from "../index";

const supplierIdSchema = z.string();

const createSupplierSchema = z.object({
  name: z.string().min(2).max(255),
});

const updateSupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(255).optional(),
});

export const supplierRouter = router({
  list: adminProcedure.query(async () => {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return suppliers;
  }),

  getById: adminProcedure
    .input(supplierIdSchema)
    .query(async ({ input }) => {
      const supplier = await prisma.supplier.findUnique({
        where: { id: input },
        include: {
          products: {
            take: 100,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { products: true },
          },
        },
      });
      if (!supplier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Supplier not found",
        });
      }
      return supplier;
    }),

  create: adminProcedure
    .input(createSupplierSchema)
    .mutation(async ({ input }) => {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: input.name },
      });
      if (existingSupplier) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Supplier name already exists",
        });
      }

      const supplier = await prisma.supplier.create({
        data: { name: input.name },
      });
      return supplier;
    }),

  update: adminProcedure
    .input(updateSupplierSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      if (!data.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name is required for update",
        });
      }

      if (data.name) {
        const existingSupplier = await prisma.supplier.findFirst({
          where: { name: data.name, NOT: { id } },
        });
        if (existingSupplier) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Supplier name already exists",
          });
        }
      }

      const supplier = await prisma.supplier.update({
        where: { id },
        data,
      });
      return supplier;
    }),

  delete: adminProcedure
    .input(supplierIdSchema)
    .mutation(async ({ input }) => {
      const productCount = await prisma.product.count({
        where: { supplierId: input },
      });

      if (productCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete supplier with existing products",
        });
      }

      await prisma.supplier.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});

export type SupplierRouter = typeof supplierRouter;
