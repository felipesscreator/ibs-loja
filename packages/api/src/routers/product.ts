import prisma from "@ibs-loja/db";
import { z } from "zod";

import { adminProcedure, router } from "../index";

const productIdSchema = z.string();
const productCodeSchema = z.string();

const createProductSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  price: z.number().positive(),
  amount: z.number().int().min(0).default(0),
  supplierId: z.string(),
});

const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  code: z.string().min(1).optional(),
  price: z.number().positive().optional(),
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
      throw new Error("Product not found");
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
        throw new Error("Product not found");
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
        throw new Error("Product code already exists");
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: input.supplierId },
      });
      if (!supplier) {
        throw new Error("Supplier not found");
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
          throw new Error("Product code already exists");
        }
      }

      if (data.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: data.supplierId },
        });
        if (!supplier) {
          throw new Error("Supplier not found");
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
      await prisma.product.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});

export type ProductRouter = typeof productRouter;
