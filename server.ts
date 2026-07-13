import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import yf from "yahoo-finance2";
// @ts-ignore
const yahooFinance = yf.default || yf;

let aiClient: Groq | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is missing. Please set it in Settings.");
    }
    aiClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return aiClient;
}

const MOCK_FINANCIALS: Record<string, any> = {
  AAPL: {
    name: "Apple Inc.",
    ticker: "AAPL",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: "3.4T",
    price: 219,
    financials: {
      revenueGrowth: "3.4% YoY",
      netIncome: "100.38B",
      freeCashFlow: "104B",
      debtToEquity: 1.45,
      peRatio: 32.5,
      operatingMargin: "30.5%",
    },
    news: [
      "Apple Intelligence roll-out is gaining traction.",
      "iPhone sales steady in emerging markets.",
      "Regulatory pressures in the EU regarding App Store policies."
    ],
    competitors: ["MSFT", "GOOGL", "SSNLF"]
  },
  TSLA: {
    name: "Tesla Inc.",
    ticker: "TSLA",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCap: "750B",
    price: 235,
    financials: {
      revenueGrowth: "15% YoY",
      netIncome: "12B",
      freeCashFlow: "4.5B",
      debtToEquity: 0.12,
      peRatio: 65,
      operatingMargin: "9.2%",
    },
    news: [
      "Cybercab announcement pushes stock higher.",
      "Margin compression due to price cuts.",
      "FSD v12 showing promising results in user testing."
    ],
    competitors: ["F", "GM", "RIVN", "BYD"]
  },
  NVDA: {
    name: "NVIDIA Corp.",
    ticker: "NVDA",
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: "3.1T",
    price: 125,
    financials: {
      revenueGrowth: "260% YoY",
      netIncome: "42B",
      freeCashFlow: "39B",
      debtToEquity: 0.25,
      peRatio: 72,
      operatingMargin: "65%",
    },
    news: [
      "Blackwell architecture chips in high demand.",
      "Data center revenue hits all-time high.",
      "Export restrictions to China remain a headwind."
    ],
    competitors: ["AMD", "INTC"]
  }
};

const DEFAULT_FINANCIALS = {
  name: "Generic Corp.",
  ticker: "GENERIC",
  sector: "Unknown",
  industry: "Unknown",
  marketCap: "10B",
  price: 50,
  financials: {
    revenueGrowth: "5% YoY",
    netIncome: "500M",
    freeCashFlow: "400M",
    debtToEquity: 1.0,
    peRatio: 20,
    operatingMargin: "15%",
  },
  news: [
    "Steady performance in a challenging macro environment.",
    "Management focuses on cost-cutting measures."
  ],
  competitors: []
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  const researchCache = new Map<string, any>();

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      if (!query) {
        return res.json({ quotes: [] });
      }
      const searchResults = await yahooFinance.search(query);
      const exactBaseMatches = searchResults.quotes.filter((q: any) => {
        const symbol = String(q.symbol).toUpperCase();
        return symbol.endsWith('.NS') || symbol.endsWith('.BO');
      });
      exactBaseMatches.sort((a: any, b: any) => {
        const aExact = String(a.symbol).split('.')[0].toUpperCase() === query.toUpperCase() ? 1 : 0;
        const bExact = String(b.symbol).split('.')[0].toUpperCase() === query.toUpperCase() ? 1 : 0;
        return bExact - aExact;
      });
      res.json({ quotes: exactBaseMatches });
    } catch (error) {
      console.error("Search API Error:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.get("/api/research", async (req, res) => {
    let query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }
    
    query = query.trim().toUpperCase();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    if (researchCache.has(query)) {
      sendEvent("progress", { message: "Loading from cache..." });
      setTimeout(() => {
        sendEvent("complete", researchCache.get(query));
        res.end();
      }, 500);
      return;
    }

    try {
      sendEvent("progress", { message: "Gathering Financial Data from Market..." });
      
      const searchResults = await yahooFinance.search(query);
      if (!searchResults.quotes || searchResults.quotes.length === 0) {
        throw new Error(`Failed to find market data for query: ${query}`);
      }
      
      let selectedQuote = searchResults.quotes[0];
      
      // Try to find an exact base symbol match (e.g., "SBIN" matches "SBIN.NS")
      const exactBaseMatches = searchResults.quotes.filter((q: any) => {
        const symbol = String(q.symbol).toUpperCase();
        const base = symbol.split('.')[0];
        return base === query.toUpperCase();
      });
      
      if (exactBaseMatches.length > 0) {
        // Prefer EQUITY
        const equityMatch = exactBaseMatches.find((q: any) => q.quoteType === 'EQUITY');
        selectedQuote = equityMatch || exactBaseMatches[0];
      } else {
        const equityMatch = searchResults.quotes.find((q: any) => q.quoteType === 'EQUITY');
        if (equityMatch) selectedQuote = equityMatch;
      }
      
      const ticker = selectedQuote.symbol as string;

      if (!ticker.toUpperCase().endsWith('.NS') && !ticker.toUpperCase().endsWith('.BO')) {
        throw new Error("We are currently operating exclusively for companies listed in the Indian stock market (NSE/BSE). Please search for an Indian company.");
      }

      let quoteResponse;
      try {
        quoteResponse = await yahooFinance.quote(ticker);
      } catch (e) {
        throw new Error(`Failed to find market data for ticker: ${ticker}`);
      }
      
      if (!quoteResponse || !quoteResponse.regularMarketPrice) {
        throw new Error(`Insufficient market data for ticker: ${ticker}`);
      }

      sendEvent("progress", { message: "Fetching Historical Data..." });
      let historicalData = [];
      try {
        const period1 = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
        let chartResponse = await yahooFinance.chart(ticker, { period1, interval: '1mo' });
        
        if (chartResponse && chartResponse.quotes && chartResponse.quotes.length < 2) {
          const p1 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // last 3 months daily
          chartResponse = await yahooFinance.chart(ticker, { period1: p1, interval: '1d' });
        }

        if (chartResponse && chartResponse.quotes) {
          historicalData = chartResponse.quotes
            .filter((q: any) => q.date && q.close != null)
            .map((q: any) => ({
              date: q.date.toISOString().split('T')[0],
              price: q.close
            }));
        }
      } catch (e) {
        console.error("Failed to fetch historical data", e);
      }

      sendEvent("progress", { message: "Analyzing Market Sentiment..." });
      const currentPrice = quoteResponse.regularMarketPrice;
      const marketCap = quoteResponse.marketCap ? (quoteResponse.marketCap / 1e9).toFixed(1) + 'B' : 'N/A';
      const companyName = quoteResponse.longName || quoteResponse.shortName || ticker;
      const sector = quoteResponse.sector || 'Unknown';
      const industry = quoteResponse.industry || 'Unknown';
      const currency = quoteResponse.currency || 'USD';
      
      const prompt = `You are an expert Investment Committee AI.
Perform a detailed investment research analysis on the company: ${companyName} (${ticker}).
We have fetched real-time market data for you:
- Current Price: ${currentPrice} ${currency}
- Market Cap: ${marketCap}
- Sector: ${sector}
- Industry: ${industry}

Based on this and your knowledge base, generate a JSON report representing an Investment Committee Verdict.
Format as JSON matching this structure:
{
  "companyInfo": {
    "name": "${companyName}",
    "ticker": "${ticker}",
    "sector": "${sector}",
    "industry": "${industry}",
    "price": ${currentPrice},
    "currency": "${currency}",
    "marketCap": "${marketCap}"
  },
  "verdict": "BUY" | "HOLD" | "PASS",
  "confidence": number (0-100),
  "bullCase": ["point 1", "point 2"],
  "bearCase": ["point 1", "point 2"],
  "valuation": {
    "fairValue": 0, // MUST BE A NUMBER
    "currentPrice": ${currentPrice},
    "upside": "..."
  },
  "riskScore": "Low" | "Medium" | "High",
  "aiThesis": "2-3 paragraphs of thesis...",
  "financialAnalysis": {
    "growth": "...",
    "profitability": "...",
    "health": "..."
  },
  "newsImpact": "...",
  "competitivePosition": "..."
}

CRITICAL: Return ONLY valid JSON. No markdown wrappers. Ensure 'price', 'fairValue', and 'currentPrice' are numbers.`;

      sendEvent("progress", { message: "Preparing Final Verdict..." });
      
      const ai = getAiClient();
      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await ai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 8192
          });
          break; // success
        } catch (error: any) {
          retries--;
          if (retries === 0 || (!error.message?.includes("rate limit") && !error.message?.includes("429"))) {
            throw error;
          }
          sendEvent("progress", { message: `Rate limit hit, retrying in 10 seconds... (${retries} attempts left)` });
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      let reportText = response?.choices[0]?.message?.content || "{}";
      reportText = reportText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      let reportJson;
      try {
        reportJson = JSON.parse(reportText);
        if (!reportJson.error) {
          reportJson.historicalData = historicalData;
          researchCache.set(query, reportJson);
        }
      } catch (e) {
        console.error("Failed to parse JSON from AI", reportText);
        reportJson = { error: "Failed to parse AI output" };
      }

      sendEvent("complete", reportJson);
      res.end();
    } catch (error: any) {
      console.error("Research API Error:", error);
      let errorMessage = "Failed to generate report.";
      if (error.message?.includes("rate limit") || error.message?.includes("429")) {
        errorMessage = "Groq API rate limit reached. Please wait a moment and try again.";
      } else if (error.message) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      sendEvent("error", { message: errorMessage });
      res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
