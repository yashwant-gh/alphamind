# AlphaMind: AI-Powered Equity Research Agent

## 📖 Overview
AlphaMind is an intelligent, real-time investment research platform tailored for the Indian Stock Market (NSE/BSE). It aggregates live market data and historical price action, then leverages large language models (LLMs) to synthesize a comprehensive "Investment Committee Verdict". 

Instead of staring at raw charts and financial tables, AlphaMind provides you with an instant, structured research report containing:
- AI-driven verdicts (BUY, HOLD, PASS) with confidence scores
- Estimated Fair Value and Upside analysis
- Structured Bull & Bear cases
- Financial health and competitive position summaries
- PDF export and personalized watchlists

## 🚀 How to Run It

### Prerequisites
- Node.js (v18 or higher)
- A Groq API Key
- A Firebase Project (with Authentication and Firestore enabled)

### Setup Steps
1. **Clone the repository** and navigate to the project directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory based on the provided `.env.example`. You will need to fill in:
   ```env
   # Backend AI Provider
   GROQ_API_KEY="your_groq_api_key"

   # Firebase Client Config
   VITE_FIREBASE_API_KEY="your_firebase_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
   VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
   VITE_FIREBASE_APP_ID="your_firebase_app_id"
   ```
4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   This will start both the Vite frontend and the Express backend concurrently on `http://localhost:3000`.

## ⚙️ How It Works (Architecture & Approach)

AlphaMind uses a **Full-Stack (React/Vite + Express)** architecture to ensure security and performance.

1. **Frontend (React + Tailwind CSS + Framer Motion)**:
   - Provides a responsive, highly-polished dark mode interface.
   - Users can search for stock tickers, view beautifully formatted AI reports, and manage their Watchlist and History via Firebase Auth/Firestore.
   - Uses Server-Sent Events (SSE) to listen for progress updates while the backend crunches data.

2. **Backend (Express + Node.js)**:
   - The `/api/research` endpoint receives the stock query.
   - It utilizes `yahoo-finance2` to pull real-time quotes, company metadata, and historical price charts (5 years).
   - The backend constructs a dense context prompt combining the raw financial data and instructs the LLM to act as an "Investment Committee".
   - It queries the **Groq API (Llama-3.3-70b-versatile)**, forcing a strict JSON output.
   - The backend proxies all external API calls, ensuring the Groq API key is never exposed to the client browser.

## ⚖️ Key Decisions & Trade-offs

- **Decision 1: Full-Stack vs. Client-Only Architecture**
  - *Why:* We built a custom Express server instead of calling Groq and Yahoo Finance directly from React.
  - *Trade-off:* Adds deployment complexity (requires Node.js hosting rather than just static hosting), but it is strictly necessary to protect the `GROQ_API_KEY` and bypass CORS restrictions on financial APIs.

- **Decision 2: Groq (Llama-3.3-70b) over traditional GPT models**
  - *Why:* Groq provides ultra-low latency inference. Generating a massive structured JSON financial report requires generating thousands of tokens; Groq does this in seconds, drastically improving UX.
  - *Trade-off:* Open-source models can sometimes drift from strict JSON schemas, so we implemented robust try/catch parsing and automated retry logic.

- **Decision 3: Server-Sent Events (SSE) for Loading States**
  - *Why:* We use SSE instead of standard REST for the research endpoint. This allows the server to stream real-time status updates ("Fetching Historical Data...", "Analyzing Sentiment...") to the client while waiting for the LLM to finish.
  - *Trade-off:* slightly more complex state management on the client, but delivers a vastly superior user experience compared to a static spinning loader.

- **Decision 4: Yahoo Finance API (`yahoo-finance2`)**
  - *Why:* Free, requires no authentication, and has excellent historical data coverage.
  - *Trade-off:* Unofficial APIs can be subject to rate-limiting or structural changes. We left out heavy fundamental data (like full SEC 10-K filings) to keep the app fast and reliable.

## 📊 Example Runs

Here is a glimpse of how the AlphaMind agent evaluates different companies based on live market data:

### Example 1: State Bank of India (SBIN.NS)
- **Verdict:** BUY (Confidence: 85%)
- **Fair Value:** ₹1,150.00 (Current: ~₹840.00)
- **Bull Case:** Dominant market share in Indian banking; strong credit growth and improving asset quality (declining NPAs); massive retail deposit base provides cheap cost of funds.
- **Bear Case:** Vulnerable to macroeconomic slowdowns; potential margin compression if interest rates peak; intense competition from private sector banks in digital banking.
- **Risk Score:** Medium

### Example 2: Zomato Ltd (ZOMATO.NS)
- **Verdict:** HOLD (Confidence: 78%)
- **Fair Value:** ₹210.00 (Current: ~₹250.00)
- **Bull Case:** Achieved sustained profitability; Blinkit (quick commerce) is showing exponential growth and market dominance; duopoly market structure ensures pricing power.
- **Bear Case:** Valuations are highly stretched leaving no room for execution errors; increasing regulatory scrutiny on gig-worker welfare; threat from ONDC and specialized quick-commerce entrants.
- **Risk Score:** High

---
*Disclaimer: AlphaMind is an AI demonstration project. The reports generated are for informational and educational purposes only and do not constitute financial advice.*
