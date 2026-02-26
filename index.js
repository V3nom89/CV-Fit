// index.js — CVFit Backend Entry Point
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const cvRoutes = require("./routes/cv");
const stripeRoutes = require("./routes/stripe");

const app = express();
const PORT = process.env.PORT || 3000;

// Necessario per Railway (proxy)
app.set("trust proxy", 1);

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────
app.use(cors({
  origin: [
    "chrome-extension://*",         // Plugin Chrome
    process.env.FRONTEND_URL,        // Landing page
    "http://localhost:*",
  ],
  credentials: true,
}));

// Stripe webhook richiede raw body — va prima di express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Rate limiting globale
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100,
  message: { message: "Troppe richieste, riprova tra poco" },
});
app.use(globalLimiter);

// Rate limiting specifico per ottimizzazione CV
const cvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 20,
  message: { message: "Limite orario ottimizzazioni raggiunto" },
});

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/cv", cvLimiter, cvRoutes);
app.use("/stripe", stripeRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", ts: new Date().toISOString() });
});

// ──────────────────────────────────────────────
// ERROR HANDLER
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Errore interno del server" });
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ CVFit API running on port ${PORT}`);
});

module.exports = app;
