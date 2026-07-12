import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { sendEmailVerification, User } from "firebase/auth";
import { Mail, ArrowRight, Loader2, LogOut } from "lucide-react";

export function VerifyEmailView({ user }: { user: User }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResend = async () => {
    setIsSending(true);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
    } catch (error: any) {
      console.error("Error sending verification email", error);
      setMessage({ type: 'error', text: error.message || 'Failed to send verification email. Please try again later.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F4F1EA] overflow-hidden text-stone-900 font-sans items-center justify-center p-6">
      {/* Background Decorative Blob */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-yellow-400/20 rounded-full blur-[120px] -mr-[400px] -mt-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[100px] -ml-[200px] -mb-[200px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-stone-200 border border-stone-200/50 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-display font-bold text-stone-900 text-center mb-2">Verify your email</h2>
        <p className="text-stone-500 text-center mb-8">
          We sent a verification link to <span className="font-medium text-stone-900">{user.email}</span>. 
          Please check your email to access your account.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-70 disabled:hover:bg-pink-500 text-white p-4 rounded-2xl font-medium transition-all shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Resend verification email <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 p-4 rounded-2xl font-medium transition-all"
          >
            I've verified my email
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <button
            onClick={handleSignOut}
            className="text-stone-500 hover:text-stone-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
