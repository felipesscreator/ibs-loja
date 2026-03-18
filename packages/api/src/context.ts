import type { NextRequest } from "next/server";

import { auth } from "@ibs-loja/auth";
import prisma from "@ibs-loja/db";
import type { Role } from "@ibs-loja/db";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  let userRole: Role = "SELLER";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    userRole = user?.role ?? "SELLER";
  }

  return {
    session,
    userRole,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
