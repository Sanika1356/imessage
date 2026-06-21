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

        // Ensure we only use real users and real data
        console.log("Database initialized for real-world contact and communication use.");

    }
    catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);  //1 means failed,0 means success
        
    }
}