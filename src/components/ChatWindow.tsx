import React, { useState, useRef, useEffect } from "react";
import { Message, Attachment, User, UserStats } from "../types";
import { Paperclip, Image as ImageIcon, ArrowUp, Search, Bell, X, User as UserIcon, FileText, LogIn, Mail } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, attachedFile?: Attachment | null, attachedImage?: Attachment | null) => void;
  isLoading: boolean;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onLogout?: () => void;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenHelp,
  onLogout,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [fileAttachment, setFileAttachment] = useState<Attachment | null>(null);
  const [imageAttachment, setImageAttachment] = useState<Attachment | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch rate-limiting state info for top user menu
  useEffect(() => {
    if (currentUser) {
      fetch(`/api/user/status?email=${encodeURIComponent(currentUser.email)}`)
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(() => {});
    }
  }, [currentUser, messages]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() && !imageAttachment && !fileAttachment) return;
    onSendMessage(inputText, fileAttachment, imageAttachment);
    setInputText("");
    setFileAttachment(null);
    setImageAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Process text document uploads
  const handleDocUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileAttachment({
        name: file.name,
        type: file.type,
        data: text,
        size: Math.round(file.size / 1024),
      });
    };
    reader.readAsText(file);
  };

  // Process visual graphic uploads
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setImageAttachment({
        name: file.name,
        type: file.type,
        data: b64,
        size: Math.round(file.size / 1024),
      });
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleImageUpload(file);
      } else {
        handleDocUpload(file);
      }
    }
  };

  // Render markdown with sans-serif styling matching modern layouts
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    const result: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      let currentLine = line;

      // Header Parsing
      if (currentLine.startsWith("### ")) {
        result.push(
          <h4 key={`h-${idx}`} className="text-sm font-bold text-[#1b0a30] mt-4 mb-2 font-sans">
            {currentLine.replace("### ", "")}
          </h4>
        );
        return;
      }
      if (currentLine.startsWith("## ")) {
        result.push(
          <h3 key={`h-${idx}`} className="text-base font-bold text-[#1b0a30] mt-5 mb-2.5 font-sans">
            {currentLine.replace("## ", "")}
          </h3>
        );
        return;
      }
      if (currentLine.startsWith("# ")) {
        result.push(
          <h2 key={`h-${idx}`} className="text-lg font-bold text-[#1b0a30] mt-6 mb-3 font-sans">
            {currentLine.replace("# ", "")}
          </h2>
        );
        return;
      }

      // Simple list parsing
      if (currentLine.trim().startsWith("* ") || currentLine.trim().startsWith("- ")) {
        const cleanText = currentLine.trim().substring(2);
        result.push(
          <li key={`li-${idx}`} className="ml-5 list-disc text-xs text-gray-700 leading-relaxed mb-1.5 font-sans">
            {parseInlineFormatting(cleanText)}
          </li>
        );
        return;
      }

      // Non-empty general paragraphs
      if (currentLine.trim()) {
        result.push(
          <p key={`p-${idx}`} className="text-xs font-sans leading-relaxed text-gray-750 mb-2.5">
            {parseInlineFormatting(currentLine)}
          </p>
        );
      } else {
        result.push(<div key={`br-${idx}`} className="h-1.5" />);
      }
    });

    return result;
  };

  // Helper parsing bold & raw inline code blocks inside lines
  const parseInlineFormatting = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let index = 0;

    while (remaining.length > 0) {
      const boldIdx = remaining.indexOf("**");
      const codeIdx = remaining.indexOf("`");

      // Check which comes first
      if (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) {
        if (boldIdx > 0) {
          parts.push(remaining.substring(0, boldIdx));
        }
        const endBoldIdx = remaining.indexOf("**", boldIdx + 2);
        if (endBoldIdx !== -1) {
          const boldText = remaining.substring(boldIdx + 2, endBoldIdx);
          parts.push(
            <span key={`b-${index++}`} className="font-bold text-[#1b0a30]">
              {boldText}
            </span>
          );
          remaining = remaining.substring(endBoldIdx + 2);
        } else {
          parts.push(remaining.substring(boldIdx));
          remaining = "";
        }
      } else if (codeIdx !== -1) {
        if (codeIdx > 0) {
          parts.push(remaining.substring(0, codeIdx));
        }
        const endCodeIdx = remaining.indexOf("`", codeIdx + 1);
        if (endCodeIdx !== -1) {
          const codeText = remaining.substring(codeIdx + 1, endCodeIdx);
          parts.push(
            <code key={`c-${index++}`} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[11px] font-mono border border-purple-100/50">
              {codeText}
            </code>
          );
          remaining = remaining.substring(endCodeIdx + 1);
        } else {
          parts.push(remaining.substring(codeIdx));
          remaining = "";
        }
      } else {
        parts.push(remaining);
        remaining = "";
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div 
      id="main-chat-window"
      className="flex-1 flex flex-col bg-[#faf9fc] text-gray-900 relative overflow-hidden h-screen"
      onDragEnter={handleDrag}
    >
      {/* Search inputs for document triggers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])}
        accept=".txt,.json,.csv,.py,.js,.ts,.html,.css,.md"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header - minimal and high-contrast */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#faf9fc]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex-1"></div>

        {/* Action Pills & Profile Matching layout exactly */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSettings}
            className="text-gray-500 hover:text-[#1b0a30] transition-colors p-1 relative cursor-pointer"
            title="System alerts"
          >
            <Bell size={18} />
          </button>

          {/* Dynamic Profile/Login Trigger Section */}
          <div className="relative">
            {!currentUser ? (
              <button
                id="user-login-trigger"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b0a30] hover:bg-neutral-800 text-white transition-all cursor-pointer border border-transparent shadow-sm text-xs font-bold font-sans"
              >
                <LogIn size={13} className="text-purple-300" />
                <span>Sign In / Log In</span>
              </button>
            ) : (
              <>
                <button
                  id="user-profile-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ebdfff] hover:bg-[#d6c3fa] text-[#1b0a30] transition-all cursor-pointer border border-transparent shadow-xs"
                >
                  <Mail size={12} className="text-purple-750 shrink-0" />
                  <span className="text-xs font-bold font-sans">
                    {currentUser.name}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#1b0a30] text-purple-200 font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {(currentUser.name || currentUser.email).charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Profile Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-3">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#1b0a30]">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{currentUser.email}</p>
                    </div>
                    
                    <div className="px-4 py-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Queries Used:</span>
                        <span className="font-mono text-[#1b0a30] font-semibold">{stats ? stats.usageCount : 0} / 50</span>
                      </div>
                      {stats && (
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-[#1b0a30]"
                            style={{ width: `${Math.min(100, ((stats.usageCount) / 50) * 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 mt-2 pt-2 px-2 space-y-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); onOpenSettings(); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-xl text-xs text-gray-600 hover:text-[#1b0a30] cursor-pointer"
                      >
                        Manage Workspace
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onOpenHelp(); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-xl text-xs text-gray-600 hover:text-[#1b0a30] cursor-pointer"
                      >
                        Getting Started Guide
                      </button>
                      {currentUser && onLogout && (
                        <button
                          onClick={() => { setUserMenuOpen(false); onLogout(); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-50 rounded-xl text-xs text-red-600 font-medium cursor-pointer"
                        >
                          Sign Out Account
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-between relative">
        {dragActive && (
          <div 
            className="absolute inset-0 bg-[#1b0a30]/10 backdrop-blur-md flex items-center justify-center z-40 p-10 border-4 border-dashed border-[#1b0a30]/20 m-4 rounded-3xl"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center text-[#1b0a30]">
              <p className="text-lg font-bold">Drag components or logs to load</p>
              <p className="text-xs text-purple-700 font-mono">Supports Text, Script or Visual PNG/JPG files</p>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          /* Empty Initial Layout - exact copy of user's uploaded image design */
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4 max-w-3xl mx-auto mt-[-4vh]">
            <h2 className="font-sans font-bold text-4xl tracking-tight text-neutral-900 mb-4 leading-tight">
              What do you have in mind,<br />feel free to share with Dx GPT
            </h2>
            <p className="text-sm text-gray-500 font-sans max-w-lg mb-8 tracking-wide font-normal">
              Start a conversation about writing, history, or anything else on your mind.
            </p>
          </div>
        ) : (
          /* Chat History Feed */
          <div className="flex-1 max-w-3xl w-full mx-auto space-y-6 pb-20 pt-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3.5 animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#1b0a30] flex items-center justify-center text-white text-[10px] font-bold shadow-md shrink-0">
                      DX
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-[20px] px-5 py-3.5 border ${
                    isUser
                      ? "bg-[#ebdfff] text-[#1b0a30] border-transparent shadow-2xs"
                      : "bg-white text-gray-800 border-gray-100 shadow-sm"
                  }`}>
                    {/* User attachments tags */}
                    {msg.attachedFile && (
                      <div className="mb-2.5 p-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2">
                        <FileText size={14} className="text-purple-600" />
                        <span className="text-[10px] font-mono text-purple-900 truncate">
                          {msg.attachedFile.name} ({msg.attachedFile.size}KB)
                        </span>
                      </div>
                    )}

                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-gray-100 max-h-48">
                        <img 
                          src={msg.image.data} 
                          alt="Loaded Part" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {isUser ? (
                        <p className="text-xs font-sans leading-relaxed text-[#1b0a30]">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>

                    <span className="block text-[8px] text-gray-400 font-mono mt-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#ebdfff] text-[#1b0a30] font-bold text-xs flex items-center justify-center border border-purple-200 shrink-0 select-none shadow-xs">
                      {(currentUser?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start items-start gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[#1b0a30] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  DX
                </div>
                <div className="bg-white border border-gray-100 rounded-[20px] px-5 py-3.5 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce"></span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Dx GPT typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input workspace precisely modeled with neo-brutalist solid shadow */}
        <div className="max-w-3xl w-full mx-auto shrink-0 relative mt-4">
          {/* Status indicators for prepared files */}
          {(fileAttachment || imageAttachment) && (
            <div className="absolute top-0 -translate-y-[105%] left-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-3 z-20 flex gap-4 animate-in slide-in-from-bottom-3">
              {fileAttachment && (
                <div className="flex items-center gap-2 bg-purple-50 text-purple-900 border border-purple-150 rounded-xl px-2.5 py-1.5 text-[10px]">
                  <FileText size={12} className="text-purple-650" />
                  <span className="font-mono truncate max-w-40">{fileAttachment.name}</span>
                  <button onClick={() => setFileAttachment(null)} className="hover:text-red-500 cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
              )}
              {imageAttachment && (
                <div className="flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-150 rounded-xl p-1 text-[10px]">
                  <img src={imageAttachment.data} className="w-7 h-7 object-cover rounded" />
                  <span className="font-mono truncate max-w-40">{imageAttachment.name}</span>
                  <button onClick={() => setImageAttachment(null)} className="hover:text-red-500 p-0.5 cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Core Rounded Command Input Border Box with offset shadow */}
          <div 
            id="chat-input-border-box"
            className="w-full bg-white border-2 border-black rounded-[24px] p-4 flex flex-col justify-between shadow-[4px_4px_0px_#1b0a30] focus-within:shadow-[6px_6px_0px_#1b0a30] transition-all duration-200 min-h-[110px]"
          >
            <textarea
              id="message-textarea"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message DX GPT"
              className="w-full text-xs text-gray-800 placeholder-purple-300 focus:outline-none bg-transparent resize-none px-2 font-sans overflow-y-auto leading-relaxed py-1"
            />

            {/* Input Action Panel Row */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-50/10">
              <div className="flex items-center gap-3 text-purple-400 pl-1.5">
                <button
                  id="attach-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-[#1b0a30] transition-colors p-1.5 rounded-full hover:bg-neutral-50 cursor-pointer"
                  title="Attach script or code logs"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  id="attach-image-btn"
                  onClick={() => imageInputRef.current?.click()}
                  className="hover:text-[#1b0a30] transition-colors p-1.5 rounded-full hover:bg-neutral-50 cursor-pointer"
                  title="Attach images for UI analysis"
                >
                  <ImageIcon size={18} />
                </button>
              </div>

              {/* White Up Arrow on Solid Dark Purple Circle send indicator */}
              <button
                id="send-message-btn"
                onClick={handleSend}
                disabled={isLoading || (!inputText.trim() && !imageAttachment && !fileAttachment)}
                className="h-10 w-10 bg-[#1b0a30] hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shadow-md active:scale-95"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Under Disclaimer Bar exactly as shown in screenshot */}
          <p className="text-[10px] text-gray-500 font-sans tracking-wide text-center mt-3 select-none">
            Dx GPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
