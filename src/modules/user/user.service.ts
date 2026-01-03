import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "./user.repository";
import { IUser } from "./user.model";

export class UserService {
    constructor(private readonly repo = new UserRepository()) { }

    async register(email: string, password: string, name: string) {
        const existing = await this.repo.findByEmail(email);
        if (existing) throw new Error("USER_EXISTS");
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.repo.create({ email, password: passwordHash, name });

        return true;
    }
    async getMe(userId: string) {
        const user = await this.repo.findById(userId);
        if (!user) throw new Error("USER_NOT_FOUND");
        return user;
    }

    async authenticate(email: string, password: string) {
        const user = await this.repo.findByEmail(email);
        if (!user) throw new Error("INVALID_CREDENTIALS");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("INVALID_CREDENTIALS");
        const { password: _, ...rest  } = user

        return {...rest, token:this.issueToken(user)};
    }

    private issueToken(user:IUser) {
        return jwt.sign({...user,id:user._id}, process.env.JWT_SECRET!, {
            expiresIn: "22h"
        });
    }
}
