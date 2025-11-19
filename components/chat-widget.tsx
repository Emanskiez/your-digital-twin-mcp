"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { queryDigitalTwin } from "@/app/actions/digital-twin";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ConversationHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey! 👋 I'm Chris's Digital Twin. Ask me anything about his background, skills, projects, or goals. Keep it focused—I'm here to answer your questions!",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for context (skip only the initial greeting for cleaner context)
      const conversationHistory: ConversationHistoryItem[] = messages
        .slice(1) // Skip initial greeting to keep context clean
        .map((m) => ({
          role: m.sender,
          content: m.text,
        }));

      console.log(`Sending ${conversationHistory.length} messages as conversation history`);
      
      // Query the digital twin RAG system with full conversation history
      const response = await queryDigitalTwin(input, conversationHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button with Animation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2c2c2c] hover:bg-[#1a1a1a] text-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-black/40 transition-all duration-300 z-40 hover:scale-110"
        aria-label="Chat with interview agent"
        title="Chat with me - if you dare to interview an AI-powered version of me! 😉"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-8 right-0 bg-[#8B6F47] text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
              Chat with me 🤖
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white border-2 border-[#2c2c2c] rounded-2xl shadow-2xl shadow-black/20 flex flex-col z-40 h-[600px] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Chat Header */}
          <div className="bg-[#2c2c2c] border-b-2 border-[#8B6F47] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B6F47] flex items-center justify-center text-sm font-bold text-white shadow-lg">
                🤖
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Chris's Digital Twin</h3>
                <p className="text-gray-300 text-xs">Powered by Groq AI • Interview-Ready</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#8B6F47]/30 hover:scrollbar-thumb-[#8B6F47]/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    message.sender === "user"
                      ? "bg-[#2c2c2c] text-white shadow-lg shadow-black/20 rounded-br-none"
                      : "bg-gray-200 border border-[#2c2c2c]/20 text-gray-800 shadow-lg shadow-gray-900/10 rounded-bl-none"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-gray-200 border border-[#2c2c2c]/20 text-gray-800 px-4 py-3 rounded-lg text-sm rounded-bl-none shadow-lg shadow-gray-900/10">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-[#8B6F47] rounded-full animate-bounce shadow-lg shadow-[#8B6F47]/60"></span>
                    <span
                      className="w-2 h-2 bg-[#8B6F47] rounded-full animate-bounce shadow-lg shadow-[#8B6F47]/60"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-[#8B6F47] rounded-full animate-bounce shadow-lg shadow-[#8B6F47]/60"
                      style={{ animationDelay: "0.4s" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-[#2c2c2c]/10 bg-white px-4 py-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-100 border-2 border-[#2c2c2c]/20 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#2c2c2c] focus:bg-white transition-all duration-300 text-sm font-medium focus:shadow-lg focus:shadow-black/10"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#2c2c2c] hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-black/40 disabled:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
