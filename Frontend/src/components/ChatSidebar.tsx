import { Plus, MessageSquare, Trash2, Menu, X, LogOut, User, Home, Info } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { auth } from "@/firebase-config";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export default function ChatSidebar() {
  const { sessions, currentSession, createNewSession, loadSession, deleteSession } = useChat() || {};
  const [isCollapsed, setIsCollapsed] = useState(useIsMobile());

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (currentSession) setIsCollapsed(true);
  }, [currentSession]);

  const navigate = useNavigate();
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/login");
        console.log("Signed out successfully");
      })
      .catch((error) => console.error("Sign out error", error));
  };

  return (
    <>
      {/* Mobile/Collapsed Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-3 left-4 z-50 p-2 bg-background/50 border border-border/50 rounded-lg md:hidden"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      <aside
        className={`group ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        } fixed md:relative w-64 h-full bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col transition-transform duration-300 z-40`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-border/50">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-glow"
          >
            <Plus className="h-5 w-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-2 pb-2 border-b border-border/50">
            <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary/50 transition-all">
                <Home className="h-4 w-4" />
                <span>Home</span>
            </Link>
            <a
              href="/#about"
              className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary/50 transition-all"
            >
              <Info className="h-4 w-4" />
              <span>About</span>
            </a>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions && sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <>
              {/* Group sessions by date */}
              {sessions && Object.entries(
                sessions.reduce((groups, session) => {
                  const dateKey = formatDate(session.timestamp);
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(session);
                  return groups;
                }, {} as Record<string, typeof sessions>)
              ).map(([date, dateSessions]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-3 pt-2">{date}</p>
                  {dateSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`chat-session-item group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        currentSession?.id === session.id
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-[.chat-session-item]:group-hover:text-foreground">{session.title}</p>
                        <p className="text-xs text-muted-foreground truncate" title={session.messages[session.messages.length - 1]?.message}>
                          {session.messages[session.messages.length - 1]?.message || "No messages yet"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded-full transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/50">
          <UserProfile />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function UserProfile() {
  const { currentUser } = useAuthContext();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg mb-1">
      <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`} alt="Profile" className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-semibold truncate">{currentUser.displayName || "User"}</span>
        <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
      </div>
    </div>
  );
}