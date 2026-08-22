"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, User, RefreshCw, Trash2, ChevronDown, Minimize2, ExternalLink, BookOpen, Newspaper, Brain } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  latencyMs?: number;
  toolsUsed?: string[];
  sources?: any[];
}

export function AgentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [memoryStats, setMemoryStats] = useState<{ shortTermTurns: number; longTermRecordsRetrieved: number }>({
    shortTermTurns: 0,
    longTermRecordsRetrieved: 0,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "👋 Greetings! I am **AgentX Oracle** (powered by the InsightScout Engine). Ask me any research, competitor, or market intelligence question!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "gemini-2.5-flash",
      toolsUsed: [],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or read sessionId & chat history from sessionStorage
  useEffect(() => {
    let sid = typeof window !== "undefined" ? sessionStorage.getItem("agentx_session_id") : null;
    if (!sid) {
      sid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
      if (typeof window !== "undefined") sessionStorage.setItem("agentx_session_id", sid);
    }
    setSessionId(sid);

    if (typeof window !== "undefined") {
      const savedHistory = sessionStorage.getItem("agentx_chat_history");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.warn("Failed to load chat history from sessionStorage:", e);
        }
      }
    }
  }, []);

  // Save chat history to sessionStorage on update
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        sessionStorage.setItem("agentx_chat_history", JSON.stringify(messages));
      } catch (e) {
        // ignore
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          sessionId: sessionId || undefined,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          isChatMode: true,
        }),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        if (typeof window !== "undefined") sessionStorage.setItem("agentx_session_id", data.sessionId);
      }

      if (data.memory) {
        setMemoryStats({
          shortTermTurns: data.memory.shortTermTurns || 0,
          longTermRecordsRetrieved: data.memory.longTermRecordsRetrieved || 0,
        });
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.response || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || "AgentX Engine",
        latencyMs: data.latencyMs,
        toolsUsed: data.toolsUsed || [],
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Error communicating with API: ${err.message || "Please check network connection."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages(messages.slice(0, 1));
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("agentx_chat_history");
    }
    setMemoryStats({ shortTermTurns: 0, longTermRecordsRetrieved: 0 });
  };

  const quickPrompts = [
    "ArXiv papers on test-time reasoning compute",
    "Latest news on AI chip manufacturing",
    "Summarize top competitor threats",
    "Explain 3nm custom NPU acquisition",
  ];

  const renderBadge = (tools?: string[]) => {
    if (!tools || tools.length === 0) {
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
          🧠 Direct
        </span>
      );
    }
    const hasArXiv = tools.includes("arxiv");
    const hasNews = tools.includes("news");
    if (hasArXiv && hasNews) {
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
          🔬📰 Both
        </span>
      );
    }
    if (hasArXiv) {
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
          🔬 ArXiv
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
        📰 News
      </span>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 group"
          aria-label="Open AgentX AI Chatbot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-extrabold text-xs tracking-wider uppercase">
              AgentX Oracle AI
            </span>
            <span className="text-[10px] font-mono text-slate-900 font-semibold">
              Tool Calling RAG • Memory Active
            </span>
          </div>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                    AgentX Oracle Chatbot
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 block">
                    powered by the InsightScout Engine
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear Chat & Reset History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Memory Telemetry Indicator Banner */}
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between text-[10px] font-mono text-cyan-300">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-cyan-400" />
                <span>🧠 Memory: {memoryStats.shortTermTurns} short-term turns · {memoryStats.longTermRecordsRetrieved} long-term records</span>
              </div>
              <span className="text-[9px] text-slate-500 truncate max-w-[90px]" title={sessionId}>
                {sessionId ? `ID: ${sessionId.slice(0, 8)}...` : ""}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isUser
                        ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none shadow-cyan-glow"
                        : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none space-y-2"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[10px]">
                        <span className="text-slate-400 block font-bold">Retrieved Sources:</span>
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>• {s.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[9px] opacity-70 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestamp}</span>
                        {!isUser && renderBadge(msg.toolsUsed)}
                      </div>
                      {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-cyan-400 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[11px] font-mono">Evaluating memory context & synthesizing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-850 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-[10px] font-mono text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-all"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Oracle any research or competitor question..."
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-40 active:scale-95 shadow-cyan-glow"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}