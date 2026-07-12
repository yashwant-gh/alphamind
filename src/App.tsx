import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Command, ArrowRight, Loader2, Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { RightPanel } from "./components/RightPanel";
import { ReportView } from "./components/ReportView";
import { LoginView } from "./components/LoginView";
import { SettingsModal } from "./components/SettingsModal";
import { VerifyEmailView } from "./components/VerifyEmailView";
import type { Report } from "./types";
import { cn } from "./lib/utils";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./lib/firebase";

import { HistoryView } from "./components/HistoryView";
import { WatchlistView } from "./components/WatchlistView";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"research" | "watchlist" | "history">("research");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{symbol: string, shortname: string, quoteType: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progressHistory, setProgressHistory] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.trim().length > 1) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
          const data = await res.json();
          if (data.quotes) {
            setSuggestions(data.quotes.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (e) {
          console.error(e);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (symbol: string) => {
    const baseSymbol = symbol.split('.')[0];
    setQuery(baseSymbol);
    setShowSuggestions(false);
    handleSearch(undefined, baseSymbol);
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);

    // Check for foreign stocks
    const foreignStocks = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "META", "AMZN", "NFLX", "APPLE", "TESLA", "NVIDIA", "MICROSOFT", "GOOGLE", "AMAZON", "NETFLIX", "META PLATFORMS"];
    if (foreignStocks.includes(searchQuery.toUpperCase())) {
      setError("We are currently operating exclusively for the Indian stock market. Please search for NSE/BSE listed companies.");
      return;
    }

    setIsSearching(true);
    setProgressHistory([]);
    setReport(null);
    setError(null);

    try {
      const response = await fetch(`/api/research?q=${encodeURIComponent(searchQuery)}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const eventMatch = line.match(/^event: (.*)$/m);
          const dataMatch = line.match(/^data: (.*)$/m);
          
          if (eventMatch && dataMatch) {
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            if (event === "progress") {
              setProgressHistory((prev) => [...prev, data.message]);
            } else if (event === "complete") {
              if (data.error) {
                setError(data.error);
              } else {
                setReport(data);
                // Save to history
                if (auth.currentUser) {
                  try {
                    const { doc, setDoc } = await import("firebase/firestore");
                    await setDoc(
                      doc(db, "users", auth.currentUser.uid, "history", Date.now().toString()), 
                      {
                        ticker: searchQuery.toUpperCase(),
                        name: data.companyInfo.name,
                        timestamp: Date.now()
                      }
                    );
                  } catch (err) {
                    console.error("Failed to save history", err);
                  }
                }
              }
              setIsSearching(false);
            } else if (event === "error") {
              setError(data.message);
              setIsSearching(false);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSearching(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
    return <VerifyEmailView user={user} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-900 font-sans relative">
      {/* GLOBAL BACKGROUND VIDEO - Always visible */}
      <div className="absolute inset-0 z-0 bg-[#050505] overflow-hidden">
        {/* Fallback/loading image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2500&auto=format&fit=crop")' }}
        />
        
        {/* YouTube Background Video (Hong Kong Drone 4K) */}
        <iframe
          className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] min-w-[1920px] min-h-[1080px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30 scale-[1.2]"
          src="https://www.youtube.com/embed/NkG5Eypwl_E?autoplay=1&mute=1&controls=0&loop=1&playlist=NkG5Eypwl_E&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1"
          allow="autoplay; encrypted-media"
          frameBorder="0"
          title="Background Video"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Gradient overlays for readability and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="print:hidden">
        <Sidebar 
          user={user} 
          onSettingsClick={() => setIsSettingsOpen(true)} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          currentView={currentView}
          onViewChange={setCurrentView}
          onClearResearch={() => {
            setQuery("");
            setReport(null);
            setError(null);
            setProgressHistory([]);
            setIsSearching(false);
          }}
        />
      </div>
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 print:overflow-visible">
        {/* Top bar with Hamburger */}
        <div className="absolute top-0 left-0 p-6 z-50 print:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-xl text-white transition-all shadow-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        {!isSearching && !report && !error && currentView === "research" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full relative z-10 pt-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center w-full"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium mb-10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                AlphaMind is ready
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm">
                Superhuman <span className="font-serif italic text-white/50 font-normal">Intelligence</span>
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
                Autonomous agents executing institutional-grade analysis in seconds for the Indian Stock Market.
              </p>

              <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-[2rem] blur-xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-700" />
                <div className="relative flex items-center bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500 group-focus-within:bg-[#0a0a0a]/80 group-focus-within:border-white/25">
                  <div className="pl-6 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Ask anything or enter a ticker (e.g. RELIANCE, TATAMOTORS)..."
                    className="w-full pl-4 pr-36 py-5 bg-transparent focus:outline-none text-white text-lg font-light placeholder-zinc-500"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={!query.trim()}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-3 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white rounded-[1.5rem] font-medium transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center text-sm tracking-wide"
                  >
                    Analyze
                  </button>
                </div>
                
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                    >
                      {suggestions.map((s, i) => (
                        <div 
                          key={i}
                          onClick={() => handleSuggestionClick(s.symbol)}
                          className="px-6 py-4 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                        >
                          <div>
                            <div className="font-semibold text-white">{s.symbol.split('.')[0]}</div>
                            <div className="text-sm text-zinc-400">{s.shortname}</div>
                          </div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider">{s.quoteType}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-400 font-medium">
                <span className="mr-2">Try:</span>
                <button type="button" onClick={() => { setQuery("RELIANCE"); handleSearch(undefined, "RELIANCE"); }} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all text-zinc-300">Reliance Ind.</button>
                <button type="button" onClick={() => { setQuery("TATAMOTORS"); handleSearch(undefined, "TATAMOTORS"); }} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all text-zinc-300">Tata Motors</button>
                <button type="button" onClick={() => { setQuery("HDFCBANK"); handleSearch(undefined, "HDFCBANK"); }} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all text-zinc-300">HDFC Bank</button>
              </div>
            </motion.div>
          </div>
        )}

        {currentView === "history" && (
          <HistoryView onSelect={(ticker) => { setQuery(ticker); setCurrentView("research"); handleSearch(undefined, ticker); }} />
        )}
        
        {currentView === "watchlist" && (
          <WatchlistView onSelect={(rep) => { setReport(rep); setCurrentView("research"); }} />
        )}

        {(isSearching || report || error) && currentView === "research" && (
          <div className="flex-1 overflow-y-auto pt-20 print:overflow-visible print:pt-0">
            <header className="sticky top-6 z-10 mx-6 max-w-2xl mb-8 ml-auto mr-auto relative print:hidden">
              <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search another company..."
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-transparent rounded-xl focus:outline-none text-white text-base transition-all placeholder-zinc-500"
                  />
                </form>
              </div>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                  >
                    {suggestions.map((s, i) => (
                      <div 
                        key={i}
                        onClick={() => handleSuggestionClick(s.symbol)}
                        className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                      >
                        <div>
                          <div className="font-semibold text-white">{s.symbol.split('.')[0]}</div>
                          <div className="text-xs text-zinc-400">{s.shortname}</div>
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider">{s.quoteType}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            <div className="p-6 md:p-10 text-white relative z-20">
              {error ? (
                <div className="max-w-2xl mx-auto p-6 bg-red-950/50 backdrop-blur-xl text-red-200 rounded-2xl border border-red-500/20 shadow-2xl">
                  <h3 className="font-bold mb-2 text-xl text-red-400">Analysis Halted</h3>
                  <p>{error}</p>
                </div>
              ) : report ? (
                <ReportView report={report} />
              ) : (
                <div className="max-w-3xl mx-auto w-full h-[50vh] flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <Search className="w-10 h-10 text-white relative z-10" />
                  </motion.div>
                  <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-tight drop-shadow-lg">Analyzing {query.toUpperCase()}</h2>
                  <p className="text-zinc-400 text-center max-w-md text-lg font-light leading-relaxed">Our AI agents are currently processing financial statements, reading transcripts, and building the investment thesis.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {(isSearching || report || error) && currentView === "research" && (
        <div className="print:hidden">
          <RightPanel 
            progressHistory={progressHistory}
            isAnalyzing={isSearching}
            isComplete={!!report}
          />
        </div>
      )}
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onProfileUpdate={() => {
          if (auth.currentUser) {
            setUser({ ...auth.currentUser } as User);
          }
        }}
      />
    </div>
  );
}
