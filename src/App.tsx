/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AuthModal from "./components/AuthModal";
import SettingsModal from "./components/SettingsModal";
import HelpModal from "./components/HelpModal";
import { User, ChatSession, Message, Attachment } from "./types";

// Generate unique sequential IDs for components
const generateId = () => Math.random().toString(36).substring(2, 11);

// Standard formatted timestamp Helper
const getFormattedTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Seed initial chats (for a new user, they start fresh instead of pre-seeded mockups)
const initialSessionsSeeding = (): ChatSession[] => [];

export default function App() {
  // 1. Core States
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemInstruction, setSystemPrompt] = useState(
    "You are Dx GPT, an elegant, ultra-professional, and highly competent AI assistant. Your visual interface uses deep purple highlights and is exceptionally clean."
  );

  // 2. Overlay Modals Manager States
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // 3. Initial state load and default profiles seeding
  useEffect(() => {
    // Attempt loading session info from local client memory
    const storedUser = localStorage.getItem("dx_gpt_user");
    const storedSessions = localStorage.getItem("dx_gpt_sessions");
    const storedPrompt = localStorage.getItem("dx_gpt_system_prompt");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }

    if (storedSessions) {
      const parsed = JSON.parse(storedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
      } else {
        setActiveSessionId("");
      }
    } else {
      const seeded = initialSessionsSeeding();
      setSessions(seeded);
      if (seeded.length > 0) {
        setActiveSessionId(seeded[0].id);
      } else {
        setActiveSessionId("");
      }
      localStorage.setItem("dx_gpt_sessions", JSON.stringify(seeded));
    }

    if (storedPrompt) {
      setSystemPrompt(storedPrompt);
    }
  }, []);

  // Sync session changes back to localStorage
  const saveSessionsToStorage = (updatedList: ChatSession[]) => {
    setSessions(updatedList);
    localStorage.setItem("dx_gpt_sessions", JSON.stringify(updatedList));
  };

  // 4. Component handlers
  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem("dx_gpt_user", JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("dx_gpt_user");
    // Soft clear but recreate initial seeds
    const freshSeeded = initialSessionsSeeding();
    saveSessionsToStorage(freshSeeded);
    if (freshSeeded.length > 0) {
      setActiveSessionId(freshSeeded[0].id);
    } else {
      setActiveSessionId("");
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("dx_gpt_user", JSON.stringify(updatedUser));
  };

  const handleUpdateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem("dx_gpt_system_prompt", prompt);
  };

  // Chat Administration
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    saveSessionsToStorage(updated);
    
    // Choose another active if deleting current
    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    } else if (updated.length === 0) {
      // Auto recreate container if all deleted
      const fallback: ChatSession = {
        id: generateId(),
        title: "New Conversation",
        messages: [],
        createdAt: Date.now(),
      };
      saveSessionsToStorage([fallback]);
      setActiveSessionId(fallback.id);
    }
  };

  const handleUpdateSessionTitle = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    saveSessionsToStorage(updated);
  };

  // 5. Message Dispatcher & AI Integration Calls
  const handleSendMessage = async (
    text: string,
    attachedFile?: Attachment | null,
    attachedImage?: Attachment | null
  ) => {
    let active = sessions.find((s) => s.id === activeSessionId);
    let currentSessions = [...sessions];
    let activeId = activeSessionId;

    // Create a new session dynamically if none exist or none with activeSessionId
    if (!active) {
      activeId = generateId();
      active = {
        id: activeId,
        title: "New Conversation",
        messages: [],
        createdAt: Date.now(),
      };
      currentSessions = [active, ...currentSessions];
    }

    // Create user query payload item
    const userMsgId = generateId();
    let queryBody = text;

    // Expand prompt representation if there's a document context
    if (attachedFile) {
      queryBody = `[Document context loaded: ${attachedFile.name}]\n\nContent:\n"""\n${attachedFile.data}\n"""\n\nPrompt:\n${text}`;
    }

    const newUserMessage: Message = {
      id: userMsgId,
      role: "user",
      content: queryBody,
      timestamp: getFormattedTime(),
      ...(attachedFile ? { attachedFile: { name: attachedFile.name, content: attachedFile.data, size: attachedFile.size } } : {}),
      ...(attachedImage ? { image: { data: attachedImage.data, type: attachedImage.type } } : {}),
    };

    // Update session instantly for slick user-feedback
    const updatedMessages = [...active.messages, newUserMessage];
    let sideTitle = active.title;
    
    // If it was default "New Conversation", rename it based on first query
    if (sideTitle === "New Conversation" && text.trim()) {
      const words = text.trim().split(" ");
      sideTitle = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    }

    const updatedSessions = currentSessions.map((s) => {
      if (s.id === activeId) {
        return {
          ...s,
          title: sideTitle,
          messages: updatedMessages,
        };
      }
      return s;
    });

    saveSessionsToStorage(updatedSessions);
    setActiveSessionId(activeId);
    setIsLoading(true);

    try {
      // Map entire session history for stateless server-side Gemini context
      const serverPayloadHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call server proxy endpoint to safeguard Gemini secrets
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: serverPayloadHistory,
          email: user?.email,
          image: attachedImage ? { data: attachedImage.data, type: attachedImage.type } : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An integration error occurred.");
      }

      // Append model response
      const modelMessage: Message = {
        id: generateId(),
        role: "model",
        content: data.text,
        timestamp: getFormattedTime(),
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === activeId) {
          return {
            ...s,
            title: sideTitle, // keep title name synchronized
            messages: [...updatedMessages, modelMessage],
          };
        }
        return s;
      });

      saveSessionsToStorage(finalSessions);

      // Increment local count statistic
      if (user) {
        handleUpdateUser({
          ...user,
          usageCount: user.usageCount + 1,
        });
      }
    } catch (err: any) {
      console.error(err);
      
      // Formulate detailed clear system diagnostics message for user
      const errorMsg: Message = {
        id: generateId(),
        role: "model",
        content: `### System Error Occurred\n\nUnable to generate response. ${err.message || "Please check server state."}`,
        timestamp: getFormattedTime(),
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === activeId) {
          return {
            ...s,
            messages: [...updatedMessages, errorMsg],
          };
        }
        return s;
      });

      saveSessionsToStorage(finalSessions);
    } finally {
      setIsLoading(false);
    }
  };

  // Find active chat node
  const currentSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div 
      id="app-root-container"
      className="flex h-screen w-screen overflow-hidden font-sans antialiased text-gray-900 bg-slate-50"
    >
      {/* 1. Left Sidebar Panels */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onUpdateSessionTitle={handleUpdateSessionTitle}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      {/* 2. Main Responsive Stage Window */}
      <ChatWindow
        messages={currentSession ? currentSession.messages : []}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        currentUser={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onLogout={handleLogout}
      />

      {/* 3. Helper Overlay Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onUserUpdate={handleUpdateUser}
        onSystemPromptUpdate={handleUpdateSystemPrompt}
        currentSystemPrompt={systemInstruction}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
