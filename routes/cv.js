// routes/cv.js — Ottimizzazione CV via Claude API

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { verifyToken, checkCredits, consumeCredit, pool } = require("../middleware/auth");
const { buildCVOptimizationPrompt } = require("../prompts/cv-optimizer");

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ──────────────────────────────────────────────
// POST /cv/optimize
// Endpoint principale — ottimizza il CV
// ──────────────────────────────────────────────
router.post("/optimize", verifyToken, checkCredits, async (req, res) => {
  const { cvText, jobDescription, jobUrl } = req.body;

  // Validazione input
  if (!cvText || cvText.trim().length < 100) {
    return res.status(400).json({ message: "CV troppo breve. Incolla il testo completo del tuo CV." });
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ message: "Descrizione offerta troppo breve." });
  }

  if (cvText.length > 8000) {
    return res.status(400).json({ message: "CV troppo lungo. Limite: 8000 caratteri." });
  }

  try {
    const prompt = buildCVOptimizationPrompt(
      cvText.trim(),
      jobDescription.trim().substring(0, 5000) // Limite sicurezza token
    );

    // Chiamata Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawResponse = message.content[0].text;

    // Parse JSON dalla risposta
    let result;
    try {
      // Rimuovi eventuali backtick markdown
      const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse error. Raw response:", rawResponse.substring(0, 500));
      return res.status(500).json({ message: "Errore nel parsing della risposta AI. Riprova." });
    }

    // Valida che i campi principali ci siano
    if (!result.optimizedCV || !result.coverLetter) {
      return res.status(500).json({ message: "Risposta AI incompleta. Riprova." });
    }

    // Consuma un credito (solo se non Pro)
    if (req.userCredits !== -1) {
      await consumeCredit(req.userId);
    }

    // Salva l'ottimizzazione nel DB (per statistiche)
    await pool.query(
      "INSERT INTO optimizations (user_id, job_url, match_score) VALUES ($1, $2, $3)",
      [req.userId, jobUrl || null, result.matchScore || null]
    );

    // Calcola crediti rimanenti
    const creditsRemaining = req.userCredits === -1
      ? -1
      : req.userCredits - 1;

    res.json({
      ...result,
      creditsRemaining,
      tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens,
    });

  } catch (err) {
    console.error("CV optimize error:", err);

    if (err.status === 429) {
      return res.status(429).json({ message: "Servizio temporaneamente sovraccarico. Riprova tra un momento." });
    }

    res.status(500).json({ message: "Errore durante l'ottimizzazione. Riprova." });
  }
});

// ──────────────────────────────────────────────
// GET /cv/history — Storico ottimizzazioni
// ──────────────────────────────────────────────
router.get("/history", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, job_url, match_score, created_at
       FROM optimizations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json({ optimizations: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Errore nel recupero storico" });
  }
});

// ──────────────────────────────────────────────
// GET /cv/stats — Statistiche personali
// ──────────────────────────────────────────────
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_optimizations,
        AVG(match_score)::int as avg_match_score,
        MAX(match_score) as best_match_score,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
       FROM optimizations
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({ stats: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Errore nel recupero statistiche" });
  }
});

module.exports = router;
