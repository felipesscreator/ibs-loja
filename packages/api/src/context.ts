import type { NextRequest } from "next/server";

import { auth } from "@ibs-loja/auth";
import prisma from "@ibs-loja/db";
import type { Role } from "@ibs-loja/db";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return {
      session: null,
      userRole: "SELLER" as Role,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return {
      session: null,
      userRole: "SELLER" as Role,
    };
  }

  return {
    session,
    userRole: user.role,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
