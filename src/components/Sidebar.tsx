import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Bookmark, History, Settings, TrendingUp, LogOut, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { User } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Sidebar({ user, onSettingsClick, isOpen, onClose, currentView, onViewChange, onClearResearch }: { user: User; onSettingsClick: () => void; isOpen: boolean; onClose: () => void; currentView: string; onViewChange: (view: "research" | "watchlist" | "history") => void; onClearResearch: () => void; }) {
  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-white/10 z-50 flex flex-col justify-between shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between p-6 mb-2">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-semibold text-xl tracking-tight">AlphaMind</span>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1 px-4">
                <NavItem icon={<LayoutDashboard size={18} />} label="Research" active={currentView === "research"} onClick={() => { onViewChange("research"); onClearResearch(); onClose(); }} />
                <NavItem icon={<Bookmark size={18} />} label="Watchlist" active={currentView === "watchlist"} onClick={() => { onViewChange("watchlist"); onClose(); }} />
                <NavItem icon={<History size={18} />} label="History" active={currentView === "history"} onClick={() => { onViewChange("history"); onClose(); }} />
              </nav>
            </div>

            <div className="p-4 border-t border-white/10">
              <div 
                className="mb-4 px-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors"
                onClick={onSettingsClick}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-9 h-9 rounded-full ring-2 ring-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user.displayName || "User"}</div>
                  <div className="text-xs text-zinc-400 truncate">{user.email}</div>
                </div>
              </div>
              <nav className="space-y-1">
                <NavItem icon={<Settings size={18} />} label="Settings" onClick={onSettingsClick} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
