// middleware/auth.js — Verifica JWT e crediti

const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Verifica token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Token mancante" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token non valido o scaduto" });
  }
}

// Verifica che l'utente abbia crediti disponibili
async function checkCredits(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT credits, plan FROM users WHERE id = $1",
      [req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const { credits, plan } = result.rows[0];

    // Piano Pro = crediti illimitati (-1 = illimitato)
    if (plan === "pro" || credits === -1) {
      req.userCredits = -1;
      req.userPlan = plan;
      return next();
    }

    if (credits <= 0) {
      return res.status(402).json({
        message: "Hai esaurito i crediti gratuiti. Passa a Pro per continuare.",
        creditsRemaining: 0,
        upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
      });
    }

    req.userCredits = credits;
    req.userPlan = plan;
    next();
  } catch (err) {
    console.error("checkCredits error:", err);
    res.status(500).json({ message: "Errore verifica crediti" });
  }
}

// Scala un credito dopo uso
async function consumeCredit(userId) {
  await pool.query(
    "UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits > 0",
    [userId]
  );
}

module.exports = { verifyToken, checkCredits, consumeCredit, pool };
