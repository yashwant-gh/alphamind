import React, { useEffect, useState } from "react";
import { collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Report } from "../types";

interface BookmarkItem {
  id: string;
  ticker: string;
  name: string;
  timestamp: number;
  report: Report;
}

export function WatchlistView({ onSelect }: { onSelect: (report: Report) => void }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "users", auth.currentUser.uid, "bookmarks"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookmarkItem));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setBookmarks(data);
    } catch (err) {
      console.error("Error fetching bookmarks", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "bookmarks", id));
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error deleting bookmark", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 pt-24 text-white">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
          <Bookmark className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-display font-bold">Watchlist</h2>
      </div>

      {!auth.currentUser ? (
        <div className="text-zinc-500">Please log in to view your watchlist.</div>
      ) : loading ? (
        <div className="text-zinc-500">Loading watchlist...</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-zinc-500">No bookmarked reports yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bookmarks.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={item.id}
              onClick={() => onSelect(item.report)}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="font-display font-bold text-2xl text-white mb-1">{item.ticker}</div>
                  <button 
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 -mr-2 -mt-2 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-zinc-400 mb-4">{item.name}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-400 font-medium">Confidence: {item.report.confidence}%</span>
                <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
                  View Report <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
