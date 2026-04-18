# Curalink — AI Medical Research Assistant

> AI-powered health research companion. Searches PubMed, OpenAlex, and ClinicalTrials.gov, then uses Llama 3 (via Groq) to generate structured, research-backed answers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (free) |
| LLM | Llama 3 70B via Groq (free) |
| Data Sources | PubMed, OpenAlex, ClinicalTrials.gov |
| Deployment | Render (free tier) |

---

## Project Structure

```
curalink/
├── backend/
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   ├── chat.js            # Multi-turn chat endpoint
│   │   └── research.js        # Direct research fetch endpoint
│   ├── services/
│   │   ├── pubmed.js          # PubMed API integration
│   │   ├── openalex.js        # OpenAlex API integration
│   │   ├── clinicalTrials.js  # ClinicalTrials.gov API integration
│   │   ├── ranker.js          # Re-ranking pipeline
│   │   └── llm.js             # Groq LLM service + query expansion
│   └── models/
│       └── Session.js         # MongoDB conversation session model
└── frontend/
    └── src/
        ├── App.jsx            # Main chat interface
        ├── components/
        │   ├── PublicationCard.jsx
        │   ├── TrialCard.jsx
        │   ├── LLMResponse.jsx
        │   ├── ProfileForm.jsx
        │   └── LoadingState.jsx
        └── utils/
            └── api.js         # API utility functions
```

---

## Step-by-Step Setup

### Step 1 — Get your free API keys

#### Groq API Key (LLM)
1. Go to https://console.groq.com
2. Sign up for free
3. Go to "API Keys" → Create new key
4. Copy the key (starts with `gsk_...`)

#### MongoDB URI (Database)
1. Go to https://cloud.mongodb.com
2. Sign up → Create a free cluster (M0 Sandbox)
3. Click "Connect" → "Drivers"
4. Copy the connection string:
   `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/curalink`
5. Replace `<password>` with your actual password

---

### Step 2 — Run locally

```bash
# 1. Clone / download the project
cd curalink

# 2. Set up backend
cd backend
cp .env.example .env
# Edit .env and fill in your GROQ_API_KEY and MONGODB_URI
npm install
npm run dev       # Starts on port 5000

# 3. Set up frontend (new terminal)
cd frontend
npm install
npm start         # Starts on port 3000
```

Open http://localhost:3000 — the app should be live!

---

### Step 3 — Deploy to Render (free)

#### Deploy the Backend

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Name**: `curalink-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `GROQ_API_KEY` = your Groq key
   - `MONGODB_URI` = your MongoDB connection string
   - `FRONTEND_URL` = (add after deploying frontend)
   - `NODE_ENV` = `production`
6. Click Deploy — copy the URL (e.g. `https://curalink-backend.onrender.com`)

#### Deploy the Frontend

1. Go to Render → New → Static Site
2. Connect same GitHub repo
3. Configure:
   - **Name**: `curalink-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://curalink-backend.onrender.com/api`
5. Click Deploy

#### Final step
Go back to your backend service on Render → Environment → set `FRONTEND_URL` to your frontend URL.

---

## How the AI Pipeline Works

```
User query
    ↓
LLM Query Expansion (Groq Llama 3 8B)
"DBS" + "Parkinson's" → "deep brain stimulation Parkinson's disease"
    ↓
Parallel Data Retrieval
├── PubMed (80 papers)
├── OpenAlex (100 papers)
└── ClinicalTrials.gov (50 trials)
    ↓
Re-Ranking Pipeline (ranker.js)
Scores by: recency + title relevance + abstract relevance + citations
    ↓
Top 8 publications + Top 6 trials
    ↓
LLM Reasoning (Groq Llama 3 70B)
Generates structured JSON response with insights + personalization
    ↓
Structured Response + Source Cards
```

---

## Example Use Cases

- "Latest treatment for lung cancer"
- "Clinical trials for diabetes in New York"
- "Top researchers in Alzheimer's disease"
- "Recent studies on heart disease"
- "Deep brain stimulation for Parkinson's"

---

## Disclaimer

Curalink is for **research and educational purposes only**.
Always consult a qualified healthcare professional before making medical decisions.
