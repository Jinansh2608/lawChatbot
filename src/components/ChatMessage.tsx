import { User, Bot, Scale, FileText, Heart } from "lucide-react";

interface ChatMessageProps {
  message: string;
  sender: "user" | "bot";
  legalAnswer?: string;
  laymanExplanation?: string;
  sources?: number[];
  isTyping?: boolean;
  timestamp: Date;
}

export default function ChatMessage({
  message,
  sender,
  legalAnswer,
  laymanExplanation,
  sources,
  isTyping,
  timestamp
}: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  if (sender === "user") {
    return (
      <div className="flex gap-3 animate-fade-in">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-medium">You</span>
            <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>
          </div>
          <div className="message-user rounded-2xl px-4 py-3 inline-block max-w-[85%]">
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center flex-shrink-0">
        <Scale className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium text-primary">LawGPT</span>
          <Heart className="h-3 w-3 text-primary/60" />
          {!isTyping && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
        {isTyping ? (
          <div className="message-bot rounded-2xl px-4 py-3 inline-block">
            <div className="flex gap-2">
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing" />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing animation-delay-200" />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing animation-delay-400" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Legal Answer */}
            {legalAnswer && (
              <div className="legal-box">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Legal Answer</span>
                </div>
                <p className="text-sm text-foreground/90">{legalAnswer}</p>
              </div>
            )}
            
            {/* Layman Explanation */}
            {laymanExplanation && (
              <div className="layman-box">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">In Simple Terms</span>
                </div>
                <p className="text-foreground/90 leading-relaxed">{laymanExplanation}</p>
              </div>
            )}
            
            {/* If only message (welcome or error messages) */}
            {!legalAnswer && !laymanExplanation && (
              <div className="message-bot rounded-2xl px-4 py-3">
                <p>{message}</p>
              </div>
            )}
            
            {/* Sources */}
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-muted-foreground">References:</span>
                {sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md"
                  >
                    IPC {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}