"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Trash2, 
  Database, 
  Bot, 
  User, 
  Sun, 
  Moon, 
  RefreshCw, 
  Wifi, 
  WifiOff
} from "lucide-react";
import { chatService } from "../services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  isNew?: boolean;
}

function TypewriterText({ 
  text, 
  onTextUpdate, 
  onComplete 
}: { 
  text: string; 
  onTextUpdate?: () => void; 
  onComplete?: () => void; 
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  
  // Configure chunk size and speed to mimic ChatGPT's smooth streaming speed
  const charsPerTick = text.length > 800 ? 4 : text.length > 400 ? 2 : 1;
  const speed = 20;

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    setIsDone(false);

    const interval = setInterval(() => {
      index += charsPerTick;
      
      if (index >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
        setIsDone(true);
        setTimeout(() => onComplete?.(), 0);
      } else {
        setDisplayedText(text.substring(0, index));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, charsPerTick, onComplete]);

  useEffect(() => {
    onTextUpdate?.();
  }, [displayedText, onTextUpdate]);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {!isDone && (
        <span 
          className="inline-block w-1.5 h-3.5 ml-1 bg-accent-blue animate-pulse" 
          style={{ verticalAlign: "middle" }} 
        />
      )}
    </p>
  );
}

const SUGGESTED_QUESTIONS = [
  "What is the admission process?",
  "What is the eligibility for B.Tech?",
  "Show placement statistics",
  "What is the attendance policy?",
  "Tell me about the CSE department",
  "What are the hostel facilities?",
  "Is transport available?",
  "What events are held annually?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [reloadStatus, setReloadStatus] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Theme and History Loading
  useEffect(() => {
    // Initial theme setup
    const savedTheme = localStorage.getItem("srminfo_theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Load history
    const savedMessages = localStorage.getItem("srminfo_chat_history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    } else {
      // Default welcome message
      setMessages([
        {
          id: "welcome",
          text: "Hi! I am SRMINFO, your college assistant. Ask me anything about admissions, placements, academic regulations, scholarships, hostel, transport, or events at SRM.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    // Backend health checks
    const verifyBackend = async () => {
      const healthy = await chatService.checkHealth();
      setIsOnline(healthy);
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 3. Toggle light/dark theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("srminfo_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 4. Save history helper
  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    const messagesToSave = newMessages.map(({ isNew, ...rest }) => rest);
    localStorage.setItem("srminfo_chat_history", JSON.stringify(messagesToSave));
  };

  // 5. Clear history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const defaultMsg: Message[] = [
        {
          id: "welcome",
          text: "Hi! I am SRMINFO, your college assistant. Ask me anything about admissions, placements, academic regulations, scholarships, hostel, transport, or events at SRM.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      saveMessages(defaultMsg);
      inputRef.current?.focus();
    }
  };

  // 6. Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    saveMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const answer = await chatService.sendMessage(userMessage.text);
      const botMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: answer,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNew: true
      };
      saveMessages([...updatedMessages, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "Sorry, I can't reach the server right now. Please ensure the backend is running and try again.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // 7. Reload Database (Admin)
  const handleReloadKnowledge = async () => {
    if (isReloading) return;
    setIsReloading(true);
    setReloadStatus(null);
    try {
      const result = await chatService.reloadKnowledge();
      setReloadStatus(`Reloaded ${result.document_count} files successfully!`);
      const systemAlert: Message = {
        id: `sys-${Date.now()}`,
        text: `[System Notice] Knowledge base reloaded (${result.document_count} files indexed).`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveMessages([...messages, systemAlert]);
    } catch (error: any) {
      setReloadStatus("Reload failed. Verify backend logs.");
    } finally {
      setIsReloading(false);
      setTimeout(() => setReloadStatus(null), 3500);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-4 md:py-6">
      {/* HEADER */}
      <header className="theme-card rounded-2xl px-5 py-3.5 mb-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-accent-blue shadow-[0_0_8px_var(--color-accent-blue)]" />
          <div>
            <h1 className="text-base font-bold tracking-wide text-slate-800 dark:text-slate-100 transition-colors">
              SRMINFO
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">College Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Health status indicator */}
          <div 
            title={isOnline === null ? "Connecting..." : isOnline ? "Connected to Backend" : "Backend Offline"}
            className="flex items-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-default transition-colors"
          >
            {isOnline === null ? (
              <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-500" />
            )}
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Reload DB */}
          <button
            onClick={handleReloadKnowledge}
            disabled={isReloading}
            title="Reload Knowledge Base"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Database className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
          </button>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-2 rounded-lg text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ADMIN NOTIFICATION */}
      {reloadStatus && (
        <div className="mb-3 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400 animate-fade-in transition-all">
          {reloadStatus}
        </div>
      )}

      {/* CHAT VIEW CONTAINER */}
      <section className="flex-1 theme-card rounded-2xl flex flex-col shadow-sm min-h-0 relative">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            const isSys = msg.text.startsWith("[System Notice]");
            
            if (isSys) {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full font-mono">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isBot ? "justify-start" : "justify-end"} items-start gap-2.5 max-w-[90%] md:max-w-[85%] ${
                  isBot ? "mr-auto" : "ml-auto"
                }`}
              >
                {isBot && (
                  <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                )}

                <div className="flex flex-col space-y-0.5">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border transition-colors ${
                      isBot
                        ? "theme-bot-msg border-slate-200 dark:border-slate-850"
                        : "bg-accent-blue border-accent-blue-hover text-white font-medium shadow-sm"
                    }`}
                  >
                    {isBot && msg.isNew ? (
                      <TypewriterText 
                        text={msg.text} 
                        onTextUpdate={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        onComplete={() => {
                          setMessages(prev => 
                            prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m)
                          );
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <span
                    className={`text-[9px] text-slate-400 dark:text-slate-500 font-medium px-1.5 ${
                      isBot ? "text-left" : "text-right"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {!isBot && (
                  <div className="h-8 w-8 rounded-lg bg-accent-blue text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing bubbles */}
          {isTyping && (
            <div className="flex justify-start items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex flex-col space-y-0.5">
                <div className="px-4 py-3 theme-bot-msg border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center space-x-1">
                  <span className="typing-dot h-1.5 w-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <span className="typing-dot h-1.5 w-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <span className="typing-dot h-1.5 w-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT PANEL & SUGGESTED PILLS */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 rounded-b-2xl">
          {/* Horizontal scroll suggested questions */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 pt-1.5 px-1 scrollbar-thin scrollbar-thumb-slate-350 dark:scrollbar-thumb-slate-800">
            {SUGGESTED_QUESTIONS.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(query)}
                disabled={isTyping || isOnline === false}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 font-medium"
              >
                {query}
              </button>
            ))}
          </div>

          {/* Form input fields */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isOnline === false ? "Bot is offline, check connection..." : "Ask a question (placements, regulations, admissions)..."}
              disabled={isOnline === false || isTyping}
              className="flex-1 theme-input px-4.5 py-2.5 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-accent-blue focus:border-accent-blue outline-none disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || isOnline === false}
              className="bg-accent-blue hover:bg-accent-blue-hover active:scale-95 disabled:opacity-40 disabled:scale-100 text-white p-2.5 rounded-xl shadow-md cursor-pointer transition-all flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
