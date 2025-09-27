import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// Section type from API/IPC
export interface Section {
  id: number;
  title: string;
  legal_text: string;
  layman_explanation: string;
  example: string;
}

// Message type
export interface Message {
  id: string;
  message: string;
  sender: "user" | "bot";
  sections?: Section[];
  sources?: number[];
  isTyping?: boolean;
  timestamp: Date;
}

// Chat session
export interface Session {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

// API response section type
interface ApiSection {
  id: number;
  title: string;
  legal_text: string;
  layman_explanation: string;
  example?: string;
}

// Context type
interface ChatContextType {
  sessions: Session[];
  currentSession: Session | null;
  sendMessage: (query: string) => Promise<void>;
  isLoading: boolean;
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, newTitle: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new session
  const createNewSession = useCallback(() => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: "New Chat",
      timestamp: new Date(),
      messages: [
        {
          id: 'initial-message',
          sender: 'bot',
          message: 'Hello! How can I help you with Indian law today?',
          timestamp: new Date(),
        },
      ],
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("lawgpt_sessions");
      if (savedSessions) {
        const parsedData = JSON.parse(savedSessions) as Session[];
        const parsedSessions: Session[] = parsedData.map(session => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setSessions(parsedSessions);

        const savedCurrentId = localStorage.getItem("lawgpt_current_session");
        if (savedCurrentId && parsedSessions.some(s => s.id === savedCurrentId)) {
          setCurrentSessionId(savedCurrentId);
        } else if (parsedSessions.length > 0) {
          setCurrentSessionId(parsedSessions[0].id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error("Could not load sessions from localStorage", error);
      localStorage.removeItem("lawgpt_sessions");
      localStorage.removeItem("lawgpt_current_session");
      createNewSession();
    }
  }, [createNewSession]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("lawgpt_sessions", JSON.stringify(sessions));
    if (currentSessionId) {
      localStorage.setItem("lawgpt_current_session", currentSessionId);
    }
  }, [sessions, currentSessionId]);

  // Send a user message and get response from API
  const sendMessage = (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: query,
      timestamp: new Date(),
    };

    const typingIndicator: Message = {
      id: `bot-typing-${Date.now()}`,
      sender: 'bot',
      message: '',
      isTyping: true,
      timestamp: new Date(),
    };

    const updateMessages = (updater: (prevMessages: Message[]) => Message[]) => {
      setSessions(prevSessions => prevSessions.map(s =>
        s.id === currentSessionId ? { ...s, messages: updater(s.messages) } : s
      ));
    };

    updateMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsLoading(true);

    const processRequest = async () => {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: { response: { summary_plain: string; sections?: ApiSection[] } } = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        message: data.response.summary_plain || "Here is the information I found.",
        sections: data.response.sections?.map(s => ({
          id: s.id,
          title: s.title,
          legal_text: s.legal_text,
          layman_explanation: s.layman_explanation,
          example: s.example || "",
        })),
        sources: data.response.sections?.map(s => s.id),
        timestamp: new Date(),
      };

      updateMessages(prev => [...prev.slice(0, -1), botMessage]);

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      let errorMessageText = 'Sorry, I encountered an error. Please try again.';
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessageText = 'Request timed out after 1 minute. Server might be busy.';
      }
      console.error("Failed to fetch chat response:", error);
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: 'bot',
        message: errorMessageText,
        sections: [],
        isTyping: false,
        timestamp: new Date(),
      };
      updateMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
    };

    processRequest();
  };

  const loadSession = (sessionId: string) => {
    if (sessions.some(s => s.id === sessionId)) setCurrentSessionId(sessionId);
    
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      if (remainingSessions.length === 0) createNewSession();
    }
  };

  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return (
    <ChatContext.Provider value={{
      sessions, currentSession, sendMessage, isLoading,
      createNewSession, loadSession, deleteSession, updateSessionTitle
    }}>

      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
