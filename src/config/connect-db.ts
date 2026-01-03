const mongoose = require('mongoose');
require('dotenv').config();

export const connectDb = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined");
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed",error);
        process.exit(1);
    }
};