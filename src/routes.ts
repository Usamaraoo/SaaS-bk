// src/routes.ts
import { Express } from "express";
import { userRoutes } from "./modules/user";
import paymentRoutes from "./modules/payment";
import subscriptionRoutes from "./modules/subscription";

export function registerRoutes(app: Express) {
  app.use("/api/users", userRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
}


