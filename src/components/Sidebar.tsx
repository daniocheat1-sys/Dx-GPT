import React, { useState } from "react";
import { ChatSession } from "../types";
import { Plus, MessageSquare, BookOpen, Settings, HelpCircle, LogOut, Trash2, Edit2, Check, History, Search } from "lucide-react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSessionTitle: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  userEmail: string | undefined;
  onLogout: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateSessionTitle,
  onOpenSettings,
  onOpenHelp,
  userEmail,
  onLogout,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateSessionTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const getSessionIcon = (title: string, isActive: boolean) => {
    const lower = title.toLowerCase();
    if (lower.includes("book") || lower.includes("write")) {
      return <BookOpen size={16} className={isActive ? "text-[#1b0a30]" : "text-purple-300"} />;
    }
    if (lower.includes("africa") || lower.includes("history") || lower.includes("culture")) {
      return <History size={16} className={isActive ? "text-[#1b0a30]" : "text-purple-300"} />;
    }
    return <MessageSquare size={16} className={isActive ? "text-[#1b0a30]" : "text-purple-300"} />;
  };

  return (
    <aside 
      id="sidebar-container"
      className="w-72 bg-[#1b0a30] text-white flex flex-col justify-between h-screen shrink-0 rounded-r-[32px] overflow-hidden shadow-2xl z-10"
    >
      <div className="flex flex-col p-6 overflow-y-auto flex-1">
        {/* Logo Header matching image */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#1b0a30] shrink-0">
            DX
          </div>
          <div>
            <h1 className="font-sans font-bold text-sm tracking-wide text-white leading-tight">DX GPT</h1>
            <p className="text-[10px] text-purple-200 font-medium">AI Assistant</p>
          </div>
        </div>

        {/* New Chat Action Button - perfect rounded pill matching picture */}
        <button
          id="new-chat-btn"
          onClick={onNewChat}
          className="w-full py-2 bg-[#ebdfff] hover:bg-[#dcd0f5] text-[#1b0a30] rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer mb-8 shadow"
        >
          <Plus size={14} strokeWidth={3} />
          <span>New Chat</span>
        </button>

        {/* Recent Chats Section */}
        <div className="flex-1 flex flex-col pt-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold text-purple-200 tracking-wider">
              Recent
            </h2>
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
              className="p-1 rounded-md text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Search past chats"
            >
              <Search size={14} />
            </button>
          </div>

          {showSearch && (
            <div className="px-1 mb-3">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-purple-300 text-xs px-3 py-1.5 rounded-xl border border-purple-800/30 focus:outline-none focus:ring-1 focus:ring-purple-300 animate-in fade-in slide-in-from-top-1 duration-150"
              />
            </div>
          )}

          <div className="space-y-1.5 overflow-y-auto max-h-[50vh] pr-1" style={{ scrollbarWidth: "thin" }}>
            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;

              return (
                <div
                  key={session.id}
                  onClick={() => !isEditing && onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#ebdfff] text-[#1b0a30] shadow-sm font-semibold"
                      : "text-purple-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full pr-8 overflow-hidden">
                    <span>
                      {getSessionIcon(session.title, isActive)}
                    </span>
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(e, session.id)}
                        autoFocus
                        className="bg-black/40 text-white focus:ring-1 focus:outline-none w-full text-xs py-0.5 px-1 rounded-full font-normal"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate pr-1 font-sans">{session.title}</span>
                    )}
                  </div>

                  {/* Operational Hover Controls */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        onClick={(e) => handleSaveEdit(e, session.id)}
                        className={`p-1 rounded-full ${isActive ? "hover:bg-[#1b0a30]/15" : "hover:bg-white/10"}`}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartEdit(e, session)}
                          className={`p-1 rounded-full ${isActive ? "hover:bg-[#1b0a30]/15 text-[#1b0a30]" : "hover:bg-white/10 text-purple-300 hover:text-white"}`}
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className={`p-1 rounded-full ${isActive ? "hover:bg-red-500/10 text-red-600" : "hover:bg-white/10 text-purple-300 hover:text-red-400"}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <span className="block text-[11px] text-purple-300/60 text-center py-4 font-mono">
                No active conversations
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer Sections matching picture */}
      <div className="p-6 border-t border-purple-950/20 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full px-4 py-2 rounded-xl text-left text-xs font-semibold text-purple-200 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 cursor-pointer"
        >
          <Settings size={16} className="text-purple-300" />
          <span>Settings</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="w-full px-4 py-2 rounded-xl text-left text-xs font-semibold text-purple-200 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 cursor-pointer"
        >
          <HelpCircle size={16} className="text-purple-300" />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
}
