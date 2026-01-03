import { AuthUser } from "../modules/user/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
