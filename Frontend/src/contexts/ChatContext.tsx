import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Message {
  id: string;
  sender: "user" | "bot";
  message: string;
  legalAnswer?: string;
  laymanExplanation?: string;
  sources?: number[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  lastMessage: string;
}

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  addMessage: (message: Message) => void;
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("lawgpt_sessions");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(() => {
    const saved = localStorage.getItem("lawgpt_current_session");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("lawgpt_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("lawgpt_current_session", JSON.stringify(currentSession));
    }
  }, [currentSession]);

  const createNewSession = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      sender: "bot",
      message: "Hello there! 💜 I'm LawGPT, your friendly legal companion. I'm here to help you understand Indian law in simple, clear terms. Whether you have questions about your rights, legal procedures, or specific IPC sections, I'll explain everything in a way that makes sense. How can I assist you today?",
      timestamp: new Date(),
    };

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [welcomeMessage],
      timestamp: new Date(),
      lastMessage: "New conversation started",
    };

    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
  };

  const addMessage = (message: Message) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message],
      lastMessage: message.message.substring(0, 50) + "...",
    };

    // Update title based on first user message
    if (currentSession.title === "New Chat" && message.sender === "user") {
      updatedSession.title = message.message.substring(0, 30) + "...";
    }

    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  return (
    <ChatContext.Provider value={{
      currentSession,
      sessions,
      addMessage,
      createNewSession,
      loadSession,
      deleteSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}