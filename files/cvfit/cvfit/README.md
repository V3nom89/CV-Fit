# CVFit — Chrome Plugin

## Struttura progetto

```
cvfit/
├── plugin/              # Estensione Chrome
│   ├── manifest.json    # Configurazione plugin
│   ├── popup.html       # UI del popup
│   ├── popup.js         # Logica popup
│   ├── content.js       # Script iniettato nelle pagine
│   ├── background.js    # Service worker
│   └── styles.css       # Stili popup
├── backend/             # API Node.js
│   ├── index.js         # Entry point
│   ├── routes/
│   │   ├── auth.js      # Registrazione/login/JWT
│   │   ├── cv.js        # Adattamento CV via Claude API
│   │   └── stripe.js    # Pagamenti e abbonamenti
│   ├── middleware/
│   │   └── auth.js      # Verifica JWT + crediti
│   └── prompts/
│       └── cv-optimizer.js  # Prompt AI ottimizzato
└── landing/
    └── index.html       # Landing page

```

## Setup rapido

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Compila le variabili
npm run dev
```

### Plugin
1. Apri Chrome → chrome://extensions
2. Attiva "Modalità sviluppatore"
3. "Carica estensione non pacchettizzata" → seleziona cartella /plugin

## Variabili ambiente (.env)
```
PORT=3000
DATABASE_URL=postgresql://...   # Supabase connection string
JWT_SECRET=your_secret_here
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```
