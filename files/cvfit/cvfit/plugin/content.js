// content.js — Iniettato nelle pagine di offerte di lavoro
// Estrae automaticamente il testo dell'offerta dal DOM

(function () {
  // Ascolta messaggi dal popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractJobDescription") {
      const jobText = extractJobDescription();
      sendResponse({ jobDescription: jobText, url: window.location.href });
    }
    return true;
  });

  function extractJobDescription() {
    // Strategia 1: selettori specifici per i siti principali
    const selectors = {
      linkedin: [
        ".jobs-description__content",
        ".job-view-layout",
        ".jobs-box__html-content",
        '[data-test-id="job-details"]'
      ],
      indeed: [
        "#jobDescriptionText",
        ".jobsearch-jobDescriptionText",
        '[data-testid="job-description"]'
      ],
      infojobs: [
        ".offer-description",
        "#offer-description",
        ".job-description"
      ],
      generic: [
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[id*="job-description"]',
        '[class*="offer-description"]',
        "article",
        "main"
      ]
    };

    const allSelectors = [
      ...selectors.linkedin,
      ...selectors.indeed,
      ...selectors.infojobs,
      ...selectors.generic
    ];

    for (const selector of allSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 200) {
        return cleanText(el.innerText);
      }
    }

    // Strategia 2: fallback — prende tutto il body e pulisce
    const body = document.body.innerText;
    if (body.length > 300) {
      return cleanText(body).substring(0, 5000);
    }

    return null;
  }

  function cleanText(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .substring(0, 6000); // Limite per non sforare i token
  }
})();
