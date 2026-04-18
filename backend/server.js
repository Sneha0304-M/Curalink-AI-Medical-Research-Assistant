require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const chatRoutes = require("./routes/chat");
const researchRoutes = require("./routes/research");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRoutes);
app.use("/api/research", researchRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── MongoDB connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
