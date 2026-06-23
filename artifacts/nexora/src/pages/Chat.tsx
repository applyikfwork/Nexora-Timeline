import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/lib/store";
import { useSendChatMessage, useGetChatHistory } from "@workspace/api-client-react";
import { MessageSquare, Send, Loader2, Bot, User, MapPin, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { selectedPlace } = useAppContext();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: history, isLoading: loadingHistory, refetch } = useGetChatHistory(
    { sessionId }, 
    { query: { refetchInterval: 5000, queryKey: ["chatHistory", sessionId] } }
  );
  
  const sendMutation = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, sendMutation.isPending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;

    const message = input;
    setInput("");
    setRateLimitMsg(null);

    try {
      await sendMutation.mutateAsync({
        data: {
          message,
          sessionId,
          placeId: selectedPlace?.id,
          placeContext: selectedPlace?.name
        }
      });
      refetch();
    } catch (error: unknown) {
      const e = error as { response?: { status?: number; data?: { retryAfter?: number } } };
      if (e?.response?.status === 429) {
        const wait = e?.response?.data?.retryAfter ?? 60;
        setRateLimitMsg(`AI quota reached — Gemini free tier limit hit. Please wait ${wait}s and try again.`);
      } else {
        setRateLimitMsg("Something went wrong. Please try again in a moment.");
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh)] bg-background">
      <div className="p-6 border-b border-white/10 bg-card/50 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nexora AI</h1>
            <p className="text-white/50 text-sm">Ask anything about any place</p>
          </div>
        </div>
        
        {selectedPlace && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Context: {selectedPlace.name}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {rateLimitMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-300 font-semibold text-sm">AI Quota Reached</p>
              <p className="text-orange-400/80 text-sm mt-0.5">{rateLimitMsg}</p>
            </div>
            <button onClick={() => setRateLimitMsg(null)} className="ml-auto text-orange-400/60 hover:text-orange-400 text-xs">✕</button>
          </motion.div>
        )}

        {history?.length === 0 && !loadingHistory && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <Bot className="w-16 h-16 text-white/10" />
            <p className="text-white/50 text-lg">
              Hello! I'm Nexora. Ask me about historical events, current conditions, or future predictions for any city.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {history?.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' 
                  ? 'bg-primary/20 border border-primary/30 text-primary' 
                  : 'bg-white/10 border border-white/20 text-white/70'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white rounded-tr-none' 
                  : 'bg-primary/10 border border-primary/20 text-white/90 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                {msg.placeContext && msg.role === 'user' && (
                  <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {msg.placeContext}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sendMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-white/90 rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-background border-t border-white/10 shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-card border-white/20 h-14 pl-6 pr-16 rounded-full text-base focus-visible:ring-primary focus-visible:border-primary text-white"
            disabled={sendMutation.isPending}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sendMutation.isPending}
            className="absolute right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
