import express from "express";
import cors from "cors";

import "dotenv/config";

import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";

import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";
import { verifyEmailConfig, getEmailServiceStatus } from "./lib/nodemailer.js";

import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import channelRoutes from "./routes/channel.route.js";
import emailRoutes from "./routes/email.route.js";
import contactRoutes from "./routes/contact.route.js";
import webSyncRoutes from "./routes/webSync.route.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const publicDir = path.join(process.cwd(), "public");

<<<<<<< HEAD
// Health check - must be BEFORE other middleware
app.get("/health", (req, res) => {
    res.status(200).json({ 
        ok: true, 
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// CORS configuration - must be BEFORE routes
app.use(cors({ 
    origin: FRONTEND_URL, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Clerk webhook - MUST be before express.json()
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk middleware
app.use(clerkMiddleware());

// Log all requests in development
if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// API Routes
=======
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        ok: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Email service status endpoint
app.get("/api/health/email", (req, res) => {
    const status = getEmailServiceStatus();
    res.status(200).json(status);
});

// it's important that you don't parse the webhook event data, it should be in the raw format
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());

>>>>>>> 634060a04e5d93827230372655c18bea0f5d5851
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sync", webSyncRoutes);

// if the public directory exists, serve the static files
// this is for the production build
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("*", (req, res, next) => {
        // Don't serve index.html for API routes
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(publicDir, "index.html"), (err) => {
            if (err) next(err);
        });
    });
}

<<<<<<< HEAD
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({ 
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

// Start server
server.listen(PORT, async () => {
    console.log("========================================");
    console.log(`🚀 Server running on PORT: ${PORT}`);
    console.log(`📱 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log("========================================");
    
    try {
        await connectDB();
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
    }

    if (process.env.NODE_ENV === "production") {
        job.start();
        console.log("✅ Cron jobs started");
    }
    
    console.log("========================================");
    console.log("✨ Server is ready to accept connections!");
    console.log("========================================");
});
=======
server.listen(PORT, () => {
    connectDB();
    verifyEmailConfig();
    console.log("\n[SERVER-STARTUP] ✓ Server is up and running on PORT:", PORT);
    console.log("[SERVER-STARTUP] ✓ Ready to accept connections\n");

    if (process.env.NODE_ENV === "production") job.start();
});
>>>>>>> 634060a04e5d93827230372655c18bea0f5d5851
