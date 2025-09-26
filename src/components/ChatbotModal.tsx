import { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2, Maximize2 } from "lucide-react";
import ChatMessage from "./ChatMessage";

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  message: string;
  legalAnswer?: string;
  laymanExplanation?: string;
  sources?: number[];
}

export default function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      message: "Hello! I'm LawGPT, your AI legal assistant. Ask me anything about Indian law, IPC sections, legal procedures, or your rights. I'll provide both legal answers and simple explanations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      message: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate API call - Replace with actual backend call
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: "",
        legalAnswer: "Under Section 420 of the Indian Penal Code, cheating and dishonestly inducing delivery of property is punishable with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
        laymanExplanation: "If someone tricks you into giving them money or property by lying or deceiving you, they can be sent to jail for up to 7 years and also have to pay a fine. This is a serious crime in India.",
        sources: [420, 415, 417],
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto animate-fade-in"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div
        className={`relative glass rounded-2xl shadow-card pointer-events-auto animate-slide-up ${
          isMinimized ? "h-16" : "h-[600px]"
        } w-full max-w-lg transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold">LawGPT Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
              {isTyping && (
                <ChatMessage
                  message=""
                  sender="bot"
                  isTyping={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about Indian law..."
                  className="flex-1 px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  onClick={handleSend}
                  className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-glow disabled:opacity-50"
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Responses are AI-generated
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}