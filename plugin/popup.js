// popup.js — Logica completa del popup CVFit

const API_BASE = "http://localhost:3000";

// ──────────────────────────────────────────────
// STATO GLOBALE
// ──────────────────────────────────────────────
let currentUser = null;
let currentTab = null;

// ──────────────────────────────────────────────
// INIZIALIZZAZIONE
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  currentTab = await getCurrentTab();
  await init();
  bindEvents();
});

async function init() {
  const { token, user, credits } = await chrome.storage.local.get(["token", "user", "credits"]);

  if (token && user) {
    currentUser = { ...user, credits };
    showMainView();
    updateCreditsUI();
    loadSavedCV();
    await tryExtractJobFromPage();
  } else {
    showView("view-auth");
  }
}

// ──────────────────────────────────────────────
// EVENT BINDINGS
// ──────────────────────────────────────────────
function bindEvents() {
  // Tab auth (login/register)
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.getElementById("form-login").classList.toggle("hidden", target !== "login");
      document.getElementById("form-register").classList.toggle("hidden", target !== "register");
    });
  });

  // Login
  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleLogin(
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
  });

  // Register
  document.getElementById("form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleRegister(
      document.getElementById("reg-name").value,
      document.getElementById("reg-email").value,
      document.getElementById("reg-password").value
    );
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await chrome.storage.local.clear();
    currentUser = null;
    showView("view-auth");
  });

  // Salva CV
  document.getElementById("btn-save-cv").addEventListener("click", async () => {
    const cv = document.getElementById("cv-input").value.trim();
    if (!cv) return;
    await chrome.storage.local.set({ savedCV: cv });
    const badge = document.getElementById("cv-saved-badge");
    badge.classList.remove("hidden");
    setTimeout(() => badge.classList.add("hidden"), 2000);
  });

  // Ricarica offerta dalla pagina
  document.getElementById("btn-reload-job").addEventListener("click", tryExtractJobFromPage);

  // Ottimizza
  document.getElementById("btn-optimize").addEventListener("click", handleOptimize);

  // Indietro dal risultato
  document.getElementById("btn-back").addEventListener("click", () => showMainView());

  // Tabs risultato
  document.querySelectorAll(".result-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".result-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".result-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`rtab-${tab.dataset.rtab}`).classList.add("active");
    });
  });

  // Copy buttons
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      navigator.clipboard.writeText(target.innerText).then(() => {
        btn.textContent = "✓ Copiato!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "📋 Copia";
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  });
}

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
async function handleLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    await chrome.storage.local.set({
      token: data.token,
      user: data.user,
      credits: data.user.credits,
    });
    currentUser = data.user;
    showMainView();
    updateCreditsUI();
    loadSavedCV();
    await tryExtractJobFromPage();
  } catch (err) {
    showError("auth-error", err.message || "Credenziali non valide");
  }
}

async function handleRegister(name, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    await chrome.storage.local.set({
      token: data.token,
      user: data.user,
      credits: data.user.credits,
    });
    currentUser = data.user;
    showMainView();
    updateCreditsUI();
  } catch (err) {
    showError("auth-error", err.message || "Errore durante la registrazione");
  }
}

// ──────────────────────────────────────────────
// ESTRAI OFFERTA DALLA PAGINA
// ──────────────────────────────────────────────
async function tryExtractJobFromPage() {
  try {
    if (!currentTab) return;
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: "extractJobDescription",
    });
    if (response?.jobDescription) {
      document.getElementById("job-input").value = response.jobDescription;
      document.getElementById("job-auto").classList.remove("hidden");
    }
  } catch {
    // Pagina non supportata o content script non iniettato — silently fail
  }
}

// ──────────────────────────────────────────────
// OTTIMIZZA CV
// ──────────────────────────────────────────────
async function handleOptimize() {
  const cvText = document.getElementById("cv-input").value.trim();
  const jobText = document.getElementById("job-input").value.trim();

  if (!cvText) {
    alert("Inserisci prima il tuo CV!");
    document.getElementById("cv-input").focus();
    return;
  }

  if (!jobText) {
    alert("Inserisci o ricarica l'offerta di lavoro!");
    document.getElementById("job-input").focus();
    return;
  }

  if (currentUser?.credits === 0) {
    document.getElementById("credits-warning").classList.remove("hidden");
    return;
  }

  showView("view-loading");

  try {
    const result = await chrome.runtime.sendMessage({
      action: "optimizeCV",
      data: {
        cvText,
        jobDescription: jobText,
        jobUrl: currentTab?.url || "",
      },
    });

    if (!result.success) throw new Error(result.error);

    // Aggiorna crediti
    if (result.data.creditsRemaining !== undefined) {
      currentUser.credits = result.data.creditsRemaining;
      await chrome.storage.local.set({ credits: result.data.creditsRemaining });
      updateCreditsUI();
    }

    showResult(result.data);
  } catch (err) {
    showView("view-main");
    if (err.message.includes("crediti")) {
      document.getElementById("credits-warning").classList.remove("hidden");
    } else {
      alert("Errore: " + err.message);
    }
  }
}

// ──────────────────────────────────────────────
// MOSTRA RISULTATO
// ──────────────────────────────────────────────
function showResult(data) {
  document.getElementById("score-value").textContent = data.matchScore
    ? `${data.matchScore}%`
    : "—";

  document.getElementById("cv-result").textContent = data.optimizedCV || "—";
  document.getElementById("cover-result").textContent = data.coverLetter || "—";
  document.getElementById("gaps-result").innerHTML = formatGaps(data.gapAnalysis);

  // Reset tabs risultato
  document.querySelectorAll(".result-tab").forEach((t, i) =>
    t.classList.toggle("active", i === 0)
  );
  document.querySelectorAll(".result-content").forEach((c, i) =>
    c.classList.toggle("active", i === 0)
  );

  showView("view-result");
}

function formatGaps(gapAnalysis) {
  if (!gapAnalysis || !gapAnalysis.length) return "<p>Nessun gap rilevante.</p>";
  return gapAnalysis
    .map(
      (g) => `
    <div style="margin-bottom:10px; padding:8px; background:rgba(108,99,255,0.08); border-radius:6px; border-left:3px solid #6c63ff;">
      <strong style="color:#a78bfa">${g.keyword}</strong>
      <p style="margin-top:4px; color:#888899; font-size:11px">${g.suggestion}</p>
    </div>`
    )
    .join("");
}

// ──────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showMainView() {
  showView("view-main");
  document.getElementById("user-badge").classList.remove("hidden");
}

function updateCreditsUI() {
  const credits = currentUser?.credits ?? 0;
  const el = document.getElementById("credits-count");
  el.textContent = credits === -1 ? "∞ Pro" : `${credits} rimasti`;
  el.style.color = credits === 0 ? "var(--error)" : credits <= 2 ? "var(--warning)" : "var(--accent)";
}

async function loadSavedCV() {
  const { savedCV } = await chrome.storage.local.get(["savedCV"]);
  if (savedCV) {
    document.getElementById("cv-input").value = savedCV;
    document.getElementById("cv-saved-badge").classList.remove("hidden");
  }
}

function showError(elId, message) {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
