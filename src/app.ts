import express from "express";
import { registerRoutes } from "./routes";
import { errorHandler } from "./shared/middleware/error-handler";
import { webhookController } from './modules/payment/webhook.controller';

import cors from "cors";

const app = express();

app.use(cors());
app.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    webhookController.handleStripeWebhook.bind(webhookController)
    // webhookController.handleStripeWebhook
);
app.use(express.json());



registerRoutes(app);
app.use(errorHandler);

export default app;
