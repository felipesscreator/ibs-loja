import { auth } from "@ibs-loja/auth";
import { randomBytes } from "crypto";
import prisma from "@ibs-loja/db";
import type { Role } from "@ibs-loja/db";
import { z } from "zod";

import { adminProcedure, router } from "../index";

const userIdSchema = z.string();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "SELLER"]),
});

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "SELLER"]).optional(),
});

export const userRouter = router({
  list: adminProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return users;
  }),

  getById: adminProcedure.input(userIdSchema).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }),

  create: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new Error("Email already in use");
      }

      const ctx = await auth.$context;
      const hashedPassword = await ctx.password.hash(input.password);
      const userId = randomBytes(16).toString("hex");

      const user = await prisma.user.create({
        data: {
          id: userId,
          name: input.name,
          email: input.email,
          emailVerified: true,
          role: input.role as Role,
          accounts: {
            create: {
              id: randomBytes(16).toString("hex"),
              accountId: userId,
              providerId: "credential",
              password: hashedPassword,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return user;
    }),

  update: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: { email: data.email, NOT: { id } },
        });
        if (existingUser) {
          throw new Error("Email already in use");
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: data as Parameters<typeof prisma.user.update>[0]["data"],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });

      return user;
    }),

  delete: adminProcedure
    .input(userIdSchema)
    .mutation(async ({ input }) => {
      await prisma.user.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});

export type UserRouter = typeof userRouter;
