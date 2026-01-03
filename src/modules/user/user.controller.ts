import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import { sendResponse } from "../../shared/helper/sendResponse";

export class UserController {
  constructor(private readonly service = new UserService()) { }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await this.service.register(
        req.body.email,
        req.body.password,
        req.body.name
      );
      return sendResponse(res, { data:  token  });

    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await this.service.authenticate(
        req.body.email,
        req.body.password
      );
      return sendResponse(res, { data:  token  });
    } catch (err) {
      next(err);
    }
  };
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getMe(req.user.id);
      return sendResponse(res, { data:  user  });
    } catch (err) {
      next(err);
    }
  };
}
