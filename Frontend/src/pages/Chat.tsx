import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Home } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import { useChat } from "@/contexts/ChatContext";

export default function Chat() {
  const navigate = useNavigate();
  const { currentSession, createNewSession } = useChat();

  useEffect(() => {
    // Create a new session if none exists
    if (!currentSession) {
      createNewSession();
    }
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 glass border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-gradient">LawGPT</span>
            <span className="text-xs text-muted-foreground">• Your Legal Companion</span>
          </div>
          
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </header>

        {/* Chat Window */}
        <ChatWindow />
      </div>
    </div>
  );
}