import React, { useState, useEffect } from "react";
import { User, UserStats } from "../types";
import { X, Sliders, RefreshCw, ShieldAlert, BadgeInfo, CheckCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: (updated: User) => void;
  onSystemPromptUpdate: (prompt: string) => void;
  currentSystemPrompt: string;
}

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  onSystemPromptUpdate,
  currentSystemPrompt,
}: SettingsModalProps) {
  const [name, setName] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [systemPrompt, setSystemPrompt] = useState(currentSystemPrompt);
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      fetchUserStats();
    }
  }, [user, isOpen]);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/status?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      setStats(data);
    } catch {
      // Offline fallback calculation
      const elapsed = Math.floor((Date.now() - user.createdAt) / 1000);
      const left = Math.max(0, 7200 - elapsed);
      setStats({
        limitExceeded: left <= 0,
        timeLeftSeconds: left,
        usageCount: user.usageCount,
        maxUsage: 50,
      });
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    setSuccessMsg("");
    try {
      const response = await fetch("/api/user/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Limits reset successfully!");
        onUserUpdate({
          ...user,
          createdAt: Date.now(),
          usageCount: 0,
        });
        await fetchUserStats();
      }
    } catch {
      // Local fallback
      setSuccessMsg("Local state limits successfully reset!");
      onUserUpdate({
        ...user,
        createdAt: Date.now(),
        usageCount: 0,
       });
      setStats({
        limitExceeded: false,
        timeLeftSeconds: 7200,
        usageCount: 0,
        maxUsage: 50,
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSave = () => {
    if (user && name.trim()) {
      onUserUpdate({ ...user, name });
    }
    onSystemPromptUpdate(systemPrompt);
    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="settings-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#1b0a30] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-purple-300" />
            <h3 className="font-sans font-bold text-base tracking-tight text-white">Dx GPT Workspace Settings</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2 border border-emerald-100">
              <CheckCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Rate limiting info */}
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/50">
            <h4 className="text-xs font-bold text-[#1b0a30] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <BadgeInfo size={14} className="text-[#1b0a30]" /> Free Tier Rate Limiting Active
            </h4>
            <div className="space-y-3">
              <p className="text-xs text-purple-900/80 leading-relaxed font-sans">
                Free tiers are capped at <strong>2 hours (7,200 seconds)</strong> total lifetime, and up to <strong>50 total queries</strong>.
              </p>
              
              {stats && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-purple-100">
                    <span className="block text-[10px] text-gray-500 font-sans uppercase font-bold tracking-wider">Time Remaining</span>
                    <span className="font-mono text-sm font-bold text-[#1b0a30]">
                      {Math.floor(stats.timeLeftSeconds / 60)}m {stats.timeLeftSeconds % 60}s
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-100">
                    <span className="block text-[10px] text-gray-500 font-sans uppercase font-bold tracking-wider">Query Budget</span>
                    <span className="font-mono text-sm font-bold text-[#1b0a30]">
                      {stats.usageCount} / {stats.maxUsage}
                    </span>
                  </div>
                </div>
              )}

              <button
                id="reset-tier-limits-btn"
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="w-full mt-2 py-2.5 bg-white text-xs font-semibold text-purple-700 hover:text-red-700 hover:bg-purple-50 border border-purple-150 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw size={12} className={resetting ? "animate-spin" : ""} />
                Reset Rate Limits (Evaluation Mode)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-sans">
              User Profile Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ella D"
              className="w-full px-4 py-2.5 text-sm bg-white text-gray-900 rounded-xl border border-gray-200 focus:outline-[#1b0a30] focus:ring-1 focus:ring-[#1b0a30]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex justify-between items-center font-sans">
              <span>System AI Instruction</span>
              <span className="text-[10px] text-purple-600 font-semibold font-mono">Gemini Context</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="You are Dx GPT, an elegant, ultra-professional AI assistant."
              className="w-full px-4 py-2.5 text-xs bg-white text-gray-800 rounded-xl border border-gray-200 focus:outline-[#1b0a30] focus:ring-1 focus:ring-[#1b0a30] font-sans leading-relaxed"
            />
          </div>

          {/* Environmental parameters information */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2.5">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block font-sans">Credentials Notice</span>
              Google API keys are processed server-side. Change your API Key using the <strong>Settings &gt; Secrets</strong> menu to prevent leaking secrets. Direct client-side calls are banned.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="save-settings-btn"
            onClick={handleSave}
            className="bg-[#1b0a30] hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Apply Workspace Changes
          </button>
        </div>
      </div>
    </div>
  );
}
