import express, { Request, Response } from "express";
import ussdRoutes from "./routes/ussd.routes";
import * as dotenv from "dotenv";

dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
server.use("/api", ussdRoutes);

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
