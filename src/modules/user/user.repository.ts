import {User} from "./user.model";

export class UserRepository {
    findById(id: string) {
        return User.findById(id).lean();
    }

    findByEmail(email: string) {
        return User.findOne({ email }).lean();
    }

    create(data: { email: string; password: string, name: string }) {
        return User.create(data);
    }
}
