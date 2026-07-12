export interface CompanyInfo {
  name: string;
  ticker: string;
  sector: string;
  industry: string;
  price: number;
  currency?: string;
  marketCap: string;
}

export interface Valuation {
  fairValue: number;
  currentPrice: number;
  upside: string;
}

export interface FinancialAnalysis {
  growth: string;
  profitability: string;
  health: string;
}

export interface Report {
  companyInfo: CompanyInfo;
  verdict: 'BUY' | 'HOLD' | 'PASS';
  confidence: number;
  bullCase: string[];
  bearCase: string[];
  valuation: Valuation;
  riskScore: 'Low' | 'Medium' | 'High';
  aiThesis: string;
  financialAnalysis: FinancialAnalysis;
  newsImpact: string;
  competitivePosition: string;
  historicalData?: { date: string; price: number }[];
}
