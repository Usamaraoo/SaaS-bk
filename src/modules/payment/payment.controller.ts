import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../shared/helper/sendResponse";

export const createCheckout = async (req: Request, res: Response) => {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const url = await PaymentService.createCheckout(userId, amount);
    return sendResponse(res, { data: { secret: url } });
};

export const createPaymentIntent = async (req: Request, res: Response) => {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const url = await PaymentService.createPaymentIntent(userId, amount);
    return sendResponse(res, { data: url });

};
