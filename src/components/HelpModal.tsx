import React from "react";
import { X, HelpCircle, FileText, Image, Shield, Sparkles } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="help-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#1b0a30] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-purple-300" />
            <h3 className="font-sans font-bold text-base tracking-tight text-white">Dx GPT Help & Details</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-4.5">
            <div className="flex gap-3">
              <div className="p-2 bg-purple-50 rounded-xl text-[#1b0a30] h-9 w-9 flex items-center justify-center shrink-0 border border-purple-100/50">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Advanced Gemini Core</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-sans">
                  Powered by the highly robust <code className="bg-purple-50 text-purple-700 px-1 py-0.5 rounded text-[10px] font-mono">gemini-3.5-flash</code>. It delivers deep, structured insights, answers reasoning problems, and handles large contextual flows under 3 seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 h-9 w-9 flex items-center justify-center shrink-0 border border-blue-150">
                <Image size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Multimodal Capabilities</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-sans">
                  Upload photos, slides, figures, or designs directly using the image uploader in the bottom input bar. Gemini parses and reviews layout images immediately!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 h-9 w-9 flex items-center justify-center shrink-0 border border-emerald-150">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Text File Intelligence</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-sans">
                  Attach text documents, scripts, source files, outlines, or CSV files. The applet automatically parses text files and appends them to your prompt context cleanly.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 h-9 w-9 flex items-center justify-center shrink-0 border border-amber-150">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Free Tier Usage Budget</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-sans">
                  As part of free tier evaluation, requests are tracked per session up to 2 hours of duration and 50 messages. You can easily reset limits inside <strong>Settings</strong> at any time!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="bg-[#1b0a30] hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
