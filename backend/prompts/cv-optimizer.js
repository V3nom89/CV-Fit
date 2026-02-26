// prompts/cv-optimizer.js — Prompt AI ottimizzato per CVFit

/**
 * Genera il prompt principale per l'ottimizzazione del CV.
 * Questo è il "cuore" del prodotto — la qualità del prompt
 * determina la qualità dell'output.
 */
function buildCVOptimizationPrompt(cvText, jobDescription) {
  return `Sei un esperto recruiter e career coach con 15 anni di esperienza in selezione del personale.
Il tuo compito è ottimizzare il CV di un candidato per una specifica offerta di lavoro.

<cv_originale>
${cvText}
</cv_originale>

<offerta_di_lavoro>
${jobDescription}
</offerta_di_lavoro>

Analizza attentamente l'offerta e il CV, poi fornisci una risposta in JSON con questa struttura esatta:

{
  "matchScore": <numero da 0 a 100 che indica la compatibilità attuale>,
  "optimizedCV": "<CV riscritto e ottimizzato - testo completo>",
  "coverLetter": "<Cover letter personalizzata - 3-4 paragrafi>",
  "gapAnalysis": [
    {
      "keyword": "<competenza o requisito mancante o da rafforzare>",
      "suggestion": "<consiglio specifico su come colmare il gap>"
    }
  ]
}

REGOLE PER IL CV OTTIMIZZATO:
1. Mantieni TUTTE le informazioni vere del CV originale — non inventare esperienze o skill
2. Riformula le esperienze usando le keyword ESATTE dell'offerta di lavoro
3. Riordina le sezioni mettendo in cima quelle più rilevanti per questa posizione
4. Usa verbi d'azione forti: "guidato", "implementato", "ottimizzato", "lanciato", "aumentato"
5. Aggiungi numeri e metriche dove possibile (es. "migliorato le performance del 30%")
6. Adatta il titolo professionale in cima al CV al ruolo cercato (se coerente)
7. Assicurati che le keyword ATS principali appaiano naturalmente nel testo

REGOLE PER LA COVER LETTER:
1. Paragrafo 1: aggancio forte — mostra di conoscere l'azienda e il ruolo
2. Paragrafo 2: 2-3 esperienze rilevanti collegate ai requisiti dell'offerta
3. Paragrafo 3: perché questa azienda specifica (basati su indizi nell'offerta)
4. Paragrafo 4: chiusura con call to action e disponibilità colloquio
5. Tono: professionale ma umano, non robotico
6. Lunghezza: 250-350 parole

REGOLE PER GAP ANALYSIS:
- Identifica max 5 gap reali (competenze richieste non presenti nel CV)
- Per ogni gap, dai un consiglio actionable e specifico
- Non segnalare come gap cose che il candidato ha già
- Ordina per importanza (il gap più critico prima)

Rispondi SOLO con il JSON valido, senza testo prima o dopo.`;
}

/**
 * Prompt per estrarre solo le keyword principali dall'offerta.
 * Usato per la sezione "Match Score" rapido senza riscrivere il CV.
 */
function buildKeywordExtractionPrompt(jobDescription) {
  return `Analizza questa offerta di lavoro ed estrai le 10-15 keyword più importanti per il matching ATS.

<offerta>
${jobDescription}
</offerta>

Rispondi SOLO con un JSON array di stringhe:
["keyword1", "keyword2", ...]

Includi: skills tecniche, soft skills chiave, certificazioni, tool specifici, titoli di studio richiesti.
Non includere parole generiche come "comunicazione", "team", "azienda".`;
}

module.exports = { buildCVOptimizationPrompt, buildKeywordExtractionPrompt };
