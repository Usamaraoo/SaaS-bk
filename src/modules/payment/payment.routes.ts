import { Router } from "express";
import { createCheckout, createPaymentIntent } from "./payment.controller";
import { requireAuth } from '../../shared/middleware/authMiddleware';

const router = Router();
router.post("/create-payment-intent", requireAuth, createPaymentIntent);
router.post("/checkout", requireAuth, createCheckout);

export default router;
