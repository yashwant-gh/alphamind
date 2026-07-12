import { motion } from "motion/react";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface RightPanelProps {
  progressHistory: string[];
  isAnalyzing: boolean;
  isComplete: boolean;
}

export function RightPanel({ progressHistory, isAnalyzing, isComplete }: RightPanelProps) {
  return (
    <div className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-md h-screen p-6 flex flex-col hidden lg:flex shrink-0 sticky top-0 overflow-y-auto z-40">
      <h3 className="font-semibold text-sm text-white mb-6 uppercase tracking-wider">Agent Status</h3>
      
      {progressHistory.length === 0 && !isAnalyzing && (
        <div className="text-sm text-zinc-500 italic">Waiting for query...</div>
      )}

      <div className="space-y-4">
        {progressHistory.map((msg, idx) => {
          const isLast = idx === progressHistory.length - 1;
          const isProcessing = isLast && isAnalyzing && !isComplete;

          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5">
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className={cn("text-sm leading-relaxed", isProcessing ? "text-white font-medium" : "text-zinc-400")}>
                {msg}
              </div>
            </motion.div>
          );
        })}
        
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Analysis Complete
            </div>
            <p className="text-xs text-emerald-400/80">Report generated from structured data analysis.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
