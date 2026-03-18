import { protectedProcedure, publicProcedure, router } from "../index";
import { dashboardRouter } from "./dashboard";
import { productRouter } from "./product";
import { saleRouter } from "./sale";
import { systemRouter } from "./system";
import { supplierRouter } from "./supplier";
import { userRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  user: userRouter,
  system: systemRouter,
  supplier: supplierRouter,
  product: productRouter,
  sale: saleRouter,
  dashboard: dashboardRouter,
});
export type AppRouter = typeof appRouter;
