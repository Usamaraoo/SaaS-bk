import app from "./app";
import { connectDb } from "./config/connect-db";
const PORT = process.env.PORT || 3000;

import dotenv from "dotenv";
dotenv.config();
const startServer = async () => {


    await connectDb();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
