import mongoose from 'mongoose';

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

export async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is required");
        }

        const conn = await mongoose.connect(mongoUri);

        console.log("MongoDB Connected", conn.connection.host);

        try {
            await mongoose.model("User").deleteMany({ clerkId: /^seed_/ });
            console.log("Cleaned up seeded/artificial users from database.");
        } catch (err) {
            console.error("Failed to delete seeded users:", err.message);
        }

    }
    catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);  //1 means failed,0 means success
        
    }
}