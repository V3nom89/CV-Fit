// routes/stripe.js — Pagamenti e abbonamenti

const express = require("express");
const Stripe = require("stripe");
const { verifyToken, pool } = require("../middleware/auth");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Prezzi Stripe (crea questi nel tuo dashboard Stripe)
const PLANS = {
  jobseeker: {
    priceId: process.env.STRIPE_PRICE_JOBSEEKER, // €9/mese
    name: "Job Seeker",
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO,        // €19/mese
    name: "Pro",
  },
};

// ──────────────────────────────────────────────
// POST /stripe/checkout
// Crea una sessione Stripe Checkout
// ──────────────────────────────────────────────
router.post("/checkout", verifyToken, async (req, res) => {
  const { plan } = req.body; // "jobseeker" | "pro"

  if (!PLANS[plan]) {
    return res.status(400).json({ message: "Piano non valido" });
  }

  try {
    // Recupera o crea customer Stripe
    const userResult = await pool.query(
      "SELECT email, name, stripe_customer_id FROM users WHERE id = $1",
      [req.userId]
    );
    const user = userResult.rows[0];

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: req.userId.toString() },
      });
      customerId = customer.id;
      await pool.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, req.userId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: req.userId.toString(), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Errore creazione checkout" });
  }
});

// ──────────────────────────────────────────────
// POST /stripe/portal
// Porta l'utente al portale di gestione abbonamento
// ──────────────────────────────────────────────
router.post("/portal", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT stripe_customer_id FROM users WHERE id = $1",
      [req.userId]
    );
    const { stripe_customer_id } = result.rows[0];

    if (!stripe_customer_id) {
      return res.status(400).json({ message: "Nessun abbonamento attivo" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Errore apertura portale" });
  }
});

// ──────────────────────────────────────────────
// POST /stripe/webhook
// Gestisce eventi Stripe (pagamenti, cancellazioni)
// ──────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // Abbonamento attivato/rinnovato
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        await activateSubscription(customerId, invoice.subscription);
        break;
      }

      // Abbonamento cancellato
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await deactivateSubscription(subscription.customer);
        break;
      }

      // Checkout completato
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.userId) {
          const plan = session.metadata.plan;
          await pool.query(
            `UPDATE users SET plan = $1, credits = -1, stripe_subscription_id = $2 WHERE id = $3`,
            [plan, session.subscription, parseInt(session.metadata.userId)]
          );
        }
        break;
      }

      default:
        // Evento non gestito — ok
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).json({ message: "Webhook handler error" });
  }
});

async function activateSubscription(customerId, subscriptionId) {
  await pool.query(
    `UPDATE users
     SET plan = 'pro', credits = -1, stripe_subscription_id = $1, updated_at = NOW()
     WHERE stripe_customer_id = $2`,
    [subscriptionId, customerId]
  );
}

async function deactivateSubscription(customerId) {
  await pool.query(
    `UPDATE users
     SET plan = 'free', credits = 0, stripe_subscription_id = NULL, updated_at = NOW()
     WHERE stripe_customer_id = $1`,
    [customerId]
  );
}

module.exports = router;
