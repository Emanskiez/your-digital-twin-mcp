"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Brain, User, Copy, Trash2 } from "lucide-react";
import { queryDigitalTwin } from "@/app/actions";

type Message = {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; score: number }>;
  timestamp: Date;
};

export default function DigitalTwinChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await queryDigitalTwin(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: result.response,
        sources: result.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const exampleQuestions = [
    "Tell me about your work experience",
    "What are your technical skills?",
    "Describe your career goals",
    "What certifications are you pursuing?",
    "Tell me about your projects",
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Digital Twin
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-Powered Professional Assistant
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Welcome to Your Digital Twin</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask me anything about your professional background, skills,
                  projects, or career goals.
                </p>
              </div>

              <div className="w-full max-w-xl space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  💭 Try asking:
                </p>
                <div className="grid gap-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 hover:bg-blue-50 dark:hover:bg-slate-800"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  🔗 Upstash Vector
                </div>
                <div className="flex items-center gap-1">
                  ⚡ Groq LLaMA 3.1
                </div>
                <div className="flex items-center gap-1">
                  🤖 RAG Technology
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-2 max-w-[80%] ${
                      message.type === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <Card
                      className={`p-4 ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none"
                          : "bg-white dark:bg-slate-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </Card>

                    {message.sources && message.sources.length > 0 && (
                      <div className="w-full space-y-2">
                        <p className="text-xs font-medium text-muted-foreground px-1">
                          📚 Sources:
                        </p>
                        {message.sources.map((source, idx) => (
                          <Card
                            key={idx}
                            className="p-3 bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700"
                          >
                            <p className="text-xs">
                              <span className="font-medium">
                                🔹 {source.title}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                (Relevance: {source.score.toFixed(3)})
                              </span>
                            </p>
                          </Card>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.type === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {message.type === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <Card className="p-4 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        Searching your professional profile...
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your professional background..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by Upstash Vector + Groq LLaMA 3.1
          </p>
        </div>
      </div>
    </div>
  );
}
