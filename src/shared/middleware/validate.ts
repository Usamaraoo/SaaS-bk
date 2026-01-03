import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate =
    (schema: ZodObject) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                // validate body directly
                schema.parse(req.body);
                next();
            } catch (err) {
                if (err instanceof ZodError) {
                    return res.status(400).json({
                        message: "Validation failed",
                        errors: err.issues.map(issue => ({
                            path: issue.path.join("."),
                            message: issue.message,
                        })),
                    });
                }
                next(err);
            }
        };