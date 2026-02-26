// background.js — Service Worker del plugin

const API_BASE = "https://api.cvfit.app"; // Cambia con il tuo dominio

// Gestione messaggi dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "optimizeCV") {
    handleOptimizeCV(request.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Mantieni il canale aperto per risposta asincrona
  }

  if (request.action === "getUser") {
    getStoredUser()
      .then((user) => sendResponse({ user }))
      .catch(() => sendResponse({ user: null }));
    return true;
  }

  if (request.action === "logout") {
    chrome.storage.local.remove(["token", "user", "credits"]);
    sendResponse({ success: true });
  }
});

async function handleOptimizeCV(data) {
  const { token } = await chrome.storage.local.get(["token"]);

  const response = await fetch(`${API_BASE}/cv/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
    body: JSON.stringify({
      cvText: data.cvText,
      jobDescription: data.jobDescription,
      jobUrl: data.jobUrl,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Errore server");
  }

  const result = await response.json();

  // Aggiorna crediti in locale
  if (result.creditsRemaining !== undefined) {
    await chrome.storage.local.set({ credits: result.creditsRemaining });
  }

  return result;
}

async function getStoredUser() {
  const data = await chrome.storage.local.get(["token", "user", "credits"]);
  if (!data.token) return null;
  return { ...data.user, credits: data.credits };
}
