import React, { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";

interface HistoryItem {
  id: string;
  ticker: string;
  name: string;
  timestamp: number;
}

export function HistoryView({ onSelect }: { onSelect: (ticker: string) => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "users", auth.currentUser.uid, "history"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full p-6 pt-24 text-white">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
          <Clock className="w-6 h-6 text-zinc-300" />
        </div>
        <h2 className="text-3xl font-display font-bold">Search History</h2>
      </div>

      {!auth.currentUser ? (
        <div className="text-zinc-500">Please log in to view your search history.</div>
      ) : loading ? (
        <div className="text-zinc-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-zinc-500">No recent searches.</div>
      ) : (
        <div className="space-y-3">
          {history.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={item.id}
              onClick={() => onSelect(item.ticker)}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-lg">{item.ticker}</div>
                <div className="text-sm text-zinc-400">{item.name}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-500">{formatDistanceToNow(item.timestamp)} ago</span>
                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
