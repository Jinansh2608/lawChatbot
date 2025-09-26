import { Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useState } from "react";

export default function ChatSidebar() {
  const { sessions, currentSession, createNewSession, loadSession, deleteSession } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <>
      {/* Mobile/Collapsed Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 p-2 glass rounded-lg md:hidden"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      <aside
        className={`${
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
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

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <>
              {/* Group sessions by date */}
              {Object.entries(
                sessions.reduce((groups, session) => {
                  const dateKey = formatDate(session.timestamp);
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(session);
                  return groups;
                }, {} as Record<string, typeof sessions>)
              ).map(([date, dateSessions]) => (
                <div key={date}>
                  <p className="text-xs text-muted-foreground mb-2 px-2">{date}</p>
                  {dateSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        currentSession?.id === session.id
                          ? "bg-primary/20 border border-primary/30"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.lastMessage}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
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
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Chat history stored locally
          </p>
        </div>
      </aside>
    </>
  );
}