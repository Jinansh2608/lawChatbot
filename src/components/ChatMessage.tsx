import { User, Bot, Scale, FileText } from "lucide-react";

interface ChatMessageProps {
  message: string;
  sender: "user" | "bot";
  legalAnswer?: string;
  laymanExplanation?: string;
  sources?: number[];
  isTyping?: boolean;
}

export default function ChatMessage({
  message,
  sender,
  legalAnswer,
  laymanExplanation,
  sources,
  isTyping
}: ChatMessageProps) {
  if (sender === "user") {
    return (
      <div className="flex gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="message-user rounded-2xl px-4 py-3 max-w-[70%]">
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Scale className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 max-w-[80%]">
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
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Simple Explanation</span>
                </div>
                <p className="text-foreground/90">{laymanExplanation}</p>
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