import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import ChatMessage from "./ChatMessage";

export default function ChatWindow() {
  const { currentSession, addMessage } = useChat();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user" as const,
      message: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setIsTyping(true);

    // Simulate API call - Replace with actual backend call
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: "bot" as const,
        message: "",
        legalAnswer: "According to Section 420 of the Indian Penal Code, cheating and dishonestly inducing delivery of property is a criminal offense. The provision states that whoever cheats and thereby dishonestly induces the person deceived to deliver any property shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
        laymanExplanation: "Let me explain this in simple terms: If someone tricks you into giving them your money or belongings by lying or deceiving you, they're committing a serious crime. They can go to jail for up to 7 years and also have to pay a fine. This law protects you from fraudsters and scammers. If this happens to you, you should file a police complaint immediately.",
        sources: [420, 415, 417],
        timestamp: new Date(),
      };
      addMessage(botResponse);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-16 w-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Welcome to LawGPT</h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation to explore Indian law
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {currentSession.messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))}
          {isTyping && (
            <ChatMessage
              message=""
              sender="bot"
              isTyping={true}
              timestamp={new Date()}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Indian law..."
              className="w-full min-h-[56px] max-h-[200px] px-4 py-3 pr-12 bg-secondary/50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-primary transition-all"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            LawGPT provides general legal information • Not a substitute for professional legal advice
          </p>
        </div>
      </div>
    </div>
  );
}