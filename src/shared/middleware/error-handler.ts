import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);

    if (err.name === "ZodError") {
        // Already handled by validate middleware? optional
        return res.status(400).json({
            message: "Validation failed",
            errors: err.errors.map((e: any) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
    }

    // Domain errors
    if (err.message === "USER_EXISTS") {
        return res.status(400).json({ message: "User already exists" });
    }
    if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    // Fallback
    res.status(500).json({ message: "Internal server error" });
}
