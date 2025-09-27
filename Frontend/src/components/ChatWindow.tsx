import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import ChatMessage from "@/components/ChatMessage";

const suggestionPrompts = [
  "What is the punishment for robbery?",
  "Explain 'culpable homicide'.",
  "What constitutes 'defamation' under the IPC?",
  "What are the laws regarding cyberbullying in India?",
];

export default function ChatWindow() {
  const { currentSession, sendMessage, isLoading } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !currentSession || isLoading) return;
    await sendMessage(input);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gradient">Welcome to LawGPT</h2>
          <p className="text-muted-foreground">
            Start a new conversation to explore Indian law
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 md:left-64 px-6 border-b border-border/50 bg-background/95 backdrop-blur-xl z-10 h-16 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground md:hidden">
          <Bot size={20} />
        </div>
        <h2 className="text-lg font-semibold truncate">
          {currentSession.title}
        </h2>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 pt-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {currentSession.messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))}

          {currentSession.messages.length <= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {suggestionPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }} 
                  className="p-4 border border-border rounded-lg text-left hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-sm">{prompt}</p>
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress} // This was pointing to a non-existent function
              placeholder="Ask anything about Indian law..."
              className="w-full min-h-[56px] max-h-[200px] px-4 py-3 pr-12 bg-secondary/50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-primary transition-all"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow"
            >
              <Send className="h-5 w-5" /> 
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            LawGPT provides general legal information • Not a substitute for professional legal advice
          </p>
        </form>
      </div>
    </div>
  );
}
