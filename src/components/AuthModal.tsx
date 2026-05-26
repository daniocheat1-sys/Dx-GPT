import React, { useState } from "react";
import { User } from "../types";
import { Mail, Lock, User as UserIcon, LogIn, Sparkles, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "daniocheat1@gmail.com" }),
      });
      const data = await response.json();
      if (data.success) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        throw new Error(data.error || "Failed standard demo login.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (data.success) {
        if (isRegister && name) {
          data.user.name = name;
        }
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err: any) {
      setError("Unable to connect to service. Operating in client standalone mode.");
      // Local standalone fallback if server is unreachable
      const mockUser: User = {
        email: email.toLowerCase(),
        name: isRegister ? name : email.split("@")[0].toUpperCase(),
        createdAt: Date.now(),
        usageCount: 0,
      };
      onAuthSuccess(mockUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="auth-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header - deep purple */}
        <div className="bg-[#1b0a30] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-purple-200 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#1b0a30] shadow-sm shrink-0">
              DX
            </div>
            <div>
              <h2 className="font-sans font-bold text-base tracking-tight text-white leading-tight">Dx GPT Workspace</h2>
              <p className="text-[10px] text-purple-200 font-medium">Secure Cloud Identity</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-100">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-sans">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ella D"
                    className="w-full pl-11 pr-4 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-200 focus:outline-[#1b0a30] focus:ring-1 focus:ring-[#1b0a30] text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-sans">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-200 focus:outline-[#1b0a30] focus:ring-1 focus:ring-[#1b0a30] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 font-sans">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-200 focus:outline-[#1b0a30] focus:ring-1 focus:ring-[#1b0a30] text-sm"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1b0a30] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={14} />
              {loading ? "Processing..." : isRegister ? "Create Free Account" : "Access DX Assistant"}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] text-gray-400 font-bold tracking-wider uppercase">OR ACCESS DEMO</span>
          </div>

          {/* Quick Demo Access (Match profile image) */}
          <button
            id="demo-profile-btn"
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-[#ebdfff] hover:bg-[#d6c3fa] text-[#1b0a30] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-transparent"
          >
            <Sparkles size={14} className="text-amber-600 animate-pulse" />
            Continue as Ella D (Reference Account)
          </button>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-purple-600 hover:text-[#1b0a30] hover:underline font-bold cursor-pointer"
            >
              {isRegister ? "Already have an account? Log in" : "Need an account? Sign up for free"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
