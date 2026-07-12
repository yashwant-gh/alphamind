import { motion } from "motion/react";
import type { Report } from "../types";
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Zap, BarChart3, LineChart, Target, Building2, BrainCircuit, Download, BookmarkPlus, Loader2, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useState, useRef } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const generatePriceData = (currentPrice: number, isBuy: boolean) => {
  const data = [];
  let price = currentPrice * (isBuy ? 0.8 : 1.2);
  const volatility = currentPrice * 0.02;
  
  for (let i = 30; i >= 0; i--) {
    data.push({
      day: `Day -${i}`,
      price: i === 0 ? currentPrice : price
    });
    price = price + (Math.random() - 0.5) * volatility + (isBuy ? volatility * 0.2 : -volatility * 0.2);
  }
  return data;
};

export function ReportView({ report }: { report: Report }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const isBuy = report.verdict === "BUY";
  const isHold = report.verdict === "HOLD";
  const isPass = report.verdict === "PASS";
  
  const chartData = report.historicalData?.length 
    ? report.historicalData.map(d => ({
        day: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        price: d.price
      }))
    : generatePriceData(report.companyInfo.price, isBuy);

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleBookmark = async () => {
    if (!auth.currentUser) {
      alert("Please log in to save reports to your watchlist.");
      return;
    }
    setIsBookmarking(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid, "bookmarks", report.companyInfo.ticker), {
        ticker: report.companyInfo.ticker,
        name: report.companyInfo.name,
        timestamp: Date.now(),
        report
      });
      setBookmarked(true);
    } catch (err) {
      console.error("Failed to bookmark", err);
    } finally {
      setIsBookmarking(false);
    }
  };

  const formatCurrency = (value: number | string, currencyCode: string = 'USD') => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2
    }).format(value);
  };
  const currency = report.companyInfo.currency || 'USD';

  const verdictColor = isBuy ? "bg-emerald-500" : isHold ? "bg-amber-500" : "bg-red-500";
  const verdictBg = isBuy ? "bg-emerald-500/10" : isHold ? "bg-amber-500/10" : "bg-red-500/10";
  const verdictText = isBuy ? "text-emerald-400" : isHold ? "text-amber-400" : "text-red-400";
  const verdictIcon = isBuy ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : isHold ? <Minus className="w-5 h-5 text-amber-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full space-y-8 pb-20 text-white"
    >
      <div className="flex justify-end gap-3 mb-4 print:hidden">
        <button
          onClick={handleBookmark}
          disabled={isBookmarking || bookmarked}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-medium text-sm disabled:opacity-50"
        >
          {isBookmarking ? <Loader2 className="w-4 h-4 animate-spin" /> : bookmarked ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4" />}
          {bookmarked ? "Saved" : "Save to Watchlist"}
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-pink-600/20"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 p-4 bg-[#050505]">
        {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm flex items-center justify-center font-display font-bold text-xl text-white overflow-hidden">
              <img 
                src={`https://logo.clearbit.com/${report.companyInfo.name.split(' ')[0].toLowerCase()}.com`} 
                alt={report.companyInfo.ticker}
                className="w-full h-full object-cover bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = report.companyInfo.ticker[0];
                }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">{report.companyInfo.name}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">{report.companyInfo.ticker}</span>
                <span>•</span>
                <span>{report.companyInfo.sector}</span>
                <span>•</span>
                <span>{report.companyInfo.industry}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-3xl font-display font-bold text-white mb-1">
            {formatCurrency(report.companyInfo.price, currency)}
          </div>
          <div className="text-sm text-zinc-400">
            Market Cap: <span className="font-medium text-white">{report.companyInfo.marketCap}</span>
          </div>
        </div>
      </motion.div>

      {/* Verdict Banner */}
      <motion.div variants={item} className={cn("rounded-2xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md", verdictBg, isBuy ? "border-emerald-500/20" : isHold ? "border-amber-500/20" : "border-red-500/20")}>
        <div className={cn("absolute top-0 left-0 w-1.5 h-full", verdictColor)} />
        
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase mb-2 text-zinc-400">
            Investment Committee Verdict
          </div>
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center justify-center w-12 h-12 rounded-full bg-white/10 shadow-sm", verdictText)}>
              {verdictIcon}
            </div>
            <div className={cn("text-4xl font-display font-bold tracking-tight", verdictText)}>
              {report.verdict}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <div className="text-sm text-zinc-400 mb-1">Confidence Score</div>
            <div className="text-2xl font-display font-bold text-white">{report.confidence}%</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-zinc-400 mb-1">Risk Level</div>
            <div className="flex items-center gap-1.5 text-2xl font-display font-bold text-white">
              <ShieldAlert className="w-5 h-5 text-zinc-400" />
              {report.riskScore}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Thesis */}
      <motion.section variants={item} className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl">
        <h2 className="flex items-center gap-2 text-xl font-display font-bold text-white mb-4">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          AI Investment Thesis
        </h2>
        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg">
          {report.aiThesis}
        </p>
      </motion.section>

      {/* Bull / Bear */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-xl">
          <h3 className="flex items-center gap-2 font-display font-bold text-emerald-400 mb-4 text-lg">
            <TrendingUp className="w-5 h-5" />
            Bull Case
          </h3>
          <ul className="space-y-3">
            {report.bullCase.map((point, i) => (
              <li key={i} className="flex gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 shadow-xl">
          <h3 className="flex items-center gap-2 font-display font-bold text-red-400 mb-4 text-lg">
            <TrendingDown className="w-5 h-5" />
            Bear Case
          </h3>
          <ul className="space-y-3">
            {report.bearCase.map((point, i) => (
              <li key={i} className="flex gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Valuation & Financials Grid */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col">
          <h3 className="flex items-center gap-2 font-display font-bold text-white mb-6 text-lg">
            <Target className="w-5 h-5 text-blue-400" />
            Valuation Model
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="text-sm text-zinc-400 mb-1">Fair Value</div>
              <div className="text-2xl font-display font-bold text-white">{formatCurrency(report.valuation.fairValue, currency)}</div>
            </div>
            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="text-sm text-zinc-400 mb-1">Current Price</div>
              <div className="text-2xl font-display font-bold text-white">{formatCurrency(report.valuation.currentPrice, currency)}</div>
            </div>
          </div>
          
          <div className="flex-1 w-full h-48 mb-6 relative z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isBuy ? "#10b981" : isHold ? "#f59e0b" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isBuy ? "#10b981" : isHold ? "#f59e0b" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} minTickGap={30} />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isBuy ? "#10b981" : isHold ? "#f59e0b" : "#ef4444"} 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-300">
            <span className="font-medium">Estimated Upside</span>
            <span className="text-xl font-display font-bold">{report.valuation.upside}</span>
          </div>
        </section>

        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col gap-4">
          <h3 className="flex items-center gap-2 font-display font-bold text-white mb-2 text-lg">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Financial Analysis
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-white mb-1">Growth Profile</div>
              <p className="text-sm text-zinc-300 leading-relaxed">{report.financialAnalysis.growth}</p>
            </div>
            <div className="h-px w-full bg-white/10" />
            <div>
              <div className="text-sm font-semibold text-white mb-1">Profitability</div>
              <p className="text-sm text-zinc-300 leading-relaxed">{report.financialAnalysis.profitability}</p>
            </div>
            <div className="h-px w-full bg-white/10" />
            <div>
              <div className="text-sm font-semibold text-white mb-1">Balance Sheet Health</div>
              <p className="text-sm text-zinc-300 leading-relaxed">{report.financialAnalysis.health}</p>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Further insights */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
          <h3 className="flex items-center gap-2 font-display font-bold text-white mb-4 text-lg">
            <Zap className="w-5 h-5 text-yellow-400" />
            News & Catalyst Impact
          </h3>
          <p className="text-zinc-300 leading-relaxed">
            {report.newsImpact}
          </p>
        </section>

        <section className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
          <h3 className="flex items-center gap-2 font-display font-bold text-white mb-4 text-lg">
            <Building2 className="w-5 h-5 text-teal-400" />
            Competitive Position
          </h3>
          <p className="text-zinc-300 leading-relaxed">
            {report.competitivePosition}
          </p>
        </section>
      </motion.div>
      </div>
    </motion.div>
  );
}
