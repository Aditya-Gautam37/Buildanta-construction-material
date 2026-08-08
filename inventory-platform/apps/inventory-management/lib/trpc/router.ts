import { t } from './base';
import { brandRoutes } from './routes/brands';
import { categoryRoutes } from './routes/categories';
import { productRoutes } from './routes/products';
import { roomRoutes } from './routes/rooms';
import { stageRoutes } from './routes/stages';
import { supplierRoutes } from './routes/suppliers';
import { taxonomyLinkRoutes } from './routes/taxonomy-links';
import { variantRoutes } from './routes/variants';

export const appRouter = t.router({
  ...productRoutes,
  ...categoryRoutes,
  ...stageRoutes,
  ...roomRoutes,
  ...supplierRoutes,
  ...brandRoutes,
  ...variantRoutes,
  ...taxonomyLinkRoutes,
});

export type AppRouter = typeof appRouter;
