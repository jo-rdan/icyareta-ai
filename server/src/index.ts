import express, { Request, Response } from "express";
import cors from "cors";
import ussdRoutes from "./routes/ussd.routes";
import apiRoutes from "./routes/api.routes";
import * as dotenv from "dotenv";

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
server.use(
  cors({
    origin: process.env.PWA_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// USSD — Africa's Talking posts here
// server.use("/api", ussdRoutes);

// PWA REST API — all frontend endpoints
server.use("/api", apiRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
server.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Icyareta Backend",
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
