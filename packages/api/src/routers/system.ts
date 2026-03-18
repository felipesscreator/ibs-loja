import { auth } from "@ibs-loja/auth";
import { randomBytes } from "crypto";
import prisma from "@ibs-loja/db";
import { z } from "zod";

import { publicProcedure, router } from "../index";

export const systemRouter = router({
  seedAdmin: publicProcedure
    .input(
      z.object({
        email: z.string().email().default("admin@ibsloja.com"),
        password: z.string().min(8).default("admin123"),
        name: z.string().min(2).default("Admin"),
      }),
    )
    .mutation(async ({ input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Seed only allowed in development");
      }

      if (process.env.ALLOW_SEED !== "true") {
        throw new Error("ALLOW_SEED env variable not set");
      }

      const existingAdmin = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingAdmin) {
        return {
          message: "Admin already exists",
          email: input.email,
        };
      }

      const ctx = await auth.$context;
      const hashedPassword = await ctx.password.hash(input.password);
      const userId = randomBytes(16).toString("hex");

      await prisma.user.create({
        data: {
          id: userId,
          name: input.name,
          email: input.email,
          emailVerified: true,
          role: "ADMIN",
          accounts: {
            create: {
              id: randomBytes(16).toString("hex"),
              accountId: userId,
              providerId: "credential",
              password: hashedPassword,
            },
          },
        },
      });

      return {
        message: "Admin created successfully",
        email: input.email,
        password: input.password,
      };
    }),
});

export type SystemRouter = typeof systemRouter;
