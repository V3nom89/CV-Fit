// routes/auth.js — Registrazione, Login, Profilo

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, verifyToken } = require("../middleware/auth");

const router = express.Router();
const FREE_CREDITS = 5; // Crediti gratuiti per i nuovi utenti

// ──────────────────────────────────────────────
// DB INIT — crea tabella se non esiste
// (In produzione usa migration tool come db-migrate)
// ──────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      plan        VARCHAR(20) DEFAULT 'free',
      credits     INTEGER DEFAULT ${FREE_CREDITS},
      stripe_customer_id VARCHAR(100),
      stripe_subscription_id VARCHAR(100),
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS optimizations (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      job_url     TEXT,
      match_score INTEGER,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ DB schema ready");
}

initDB().catch(console.error);

// ──────────────────────────────────────────────
// POST /auth/register
// ──────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "La password deve essere di almeno 8 caratteri" });
  }

  try {
    // Verifica email non già in uso
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Email già registrata" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, credits, plan)
       VALUES ($1, $2, $3, $4, 'free')
       RETURNING id, name, email, credits, plan, created_at`,
      [name, email, hashedPassword, FREE_CREDITS]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Errore durante la registrazione" });
  }
});

// ──────────────────────────────────────────────
// POST /auth/login
// ──────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e password obbligatorie" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password, plan, credits FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, credits: user.credits },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Errore durante il login" });
  }
});

// ──────────────────────────────────────────────
// GET /auth/me — Profilo utente corrente
// ──────────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, plan, credits, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Errore server" });
  }
});

// ──────────────────────────────────────────────
// UTILITY
// ──────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

module.exports = router;
