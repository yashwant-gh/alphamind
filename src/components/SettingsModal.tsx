import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, AlertTriangle, Loader2, Save } from "lucide-react";
import { auth } from "../lib/firebase";
import { deleteUser, updateProfile } from "firebase/auth";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: () => void;
}

export function SettingsModal({ isOpen, onClose, onProfileUpdate }: SettingsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(user, { displayName });
      setSuccess("Profile updated successfully");
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteUser(user);
      onClose();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("This operation is sensitive and requires recent authentication. Please sign out and sign in again before retrying this request.");
      } else {
        setError(err.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h2 className="text-lg font-semibold text-zinc-900">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 mb-2">Profile Details</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-600 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                        placeholder="Your name"
                      />
                    </div>
                    {success && (
                      <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                        {success}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isUpdating || displayName === auth.currentUser?.displayName}
                      className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </button>
                  </form>
                </div>

                <div className="h-px w-full bg-zinc-100" />

                <div>
                  <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
                  <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                    <h4 className="font-medium text-zinc-900 mb-1">Delete Account</h4>
                    <p className="text-sm text-zinc-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {!showConfirm ? (
                      <button
                        onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        Delete my account
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-red-600">Are you absolutely sure?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-red-600"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Yes, delete it
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirm(false);
                              setError(null);
                            }}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
