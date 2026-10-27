import mongoose from "mongoose";

const connectDB = async (retries = 5, delay = 2500) => {
    for (let i = 1; i <= retries; i++) {
        try {
            await mongoose.connect(process.env.MONGODB_URL, {
                serverSelectionTimeoutMS: 8000,
            });
            console.log("DB Connected Successfully");
            return;
        } catch (error) {
            console.error(`DB Connection attempt ${i}/${retries} failed: ${error.message}`);
            if (i < retries) {
                console.log(`Retrying DB connection in ${delay / 1000}s...`);
                await new Promise((r) => setTimeout(r, delay));
            } else {
                console.error("DB Error: All MongoDB connection attempts failed.");
                console.error("Check network connection or MongoDB Atlas IP whitelist (https://cloud.mongodb.com).");
            }
        }
    }
}

export default connectDB