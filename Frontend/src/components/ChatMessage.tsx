import { Bot, User, Scale, BookOpen, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuthContext } from "@/contexts/AuthContext";
import { Message } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ChatMessage = ({
  sender,
  message,
  sections,
  isTyping,
  timestamp,
}: Message) => {
  const isBot = sender === "bot";
  const { currentUser } = useAuthContext();

  return (
    <div
      className={cn(
        "flex items-start gap-4 animate-fade-in",
        isBot ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isBot ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        {isBot ? (
          <Bot size={20} />
        ) : (
          <img
            src={currentUser?.photoURL || ""}
            alt="You"
            className="h-full w-full rounded-full"
          />
        )}
      </div>

      {/* Message box */}
      <div
        className={cn(
          "w-full max-w-2xl space-y-3 rounded-xl px-4 py-3",
          isBot ? "bg-secondary" : "bg-primary text-primary-foreground"
        )}
      >
        {/* Typing indicator */}
        {isTyping ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-150" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-300" />
          </div>
        ) : (
          <>
            {message && (
              <div
                className={cn(
                  "prose prose-sm dark:prose-invert max-w-none prose-p:text-current",
                  isBot ? "" : "text-primary-foreground"
                )}
              />
            )}
            {/* Message content */}
            <div
              className={cn(
                "prose prose-sm dark:prose-invert max-w-none prose-p:text-current",
                isBot ? "" : "text-primary-foreground"
              )}
            >
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>

            {/* Sections accordion */}
            {sections && sections.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isBot ? "text-muted-foreground" : "text-primary-foreground/70"
                  )}
                >
                  Relevant Sections
                </h4>

                <Accordion type="single" collapsible className="w-full">
                  {sections.map((section) => (
                    <AccordionItem
                      key={section.id}
                      value={`item-${section.id}`}
                      className={cn(
                        "rounded-lg border px-3",
                        isBot
                          ? "bg-background/50 border-border"
                          : "bg-primary-foreground/10 border-primary-foreground/20"
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          "py-2 text-sm font-medium hover:no-underline",
                          isBot ? "" : "text-primary-foreground"
                        )}
                      >
                        {section.title}
                      </AccordionTrigger>

                      <AccordionContent className="space-y-4 px-1 pb-3">
                        {/* Layman Explanation */}
                        {section.layman_explanation && (
                          <div>
                            <div
                              className={cn(
                                "mb-1 flex items-center gap-2 text-xs",
                                isBot
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/80"
                              )}
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>Simple Explanation</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground/90">
                              <ReactMarkdown>
                                {section.layman_explanation}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Example */}
                        {section.example && (
                          <div>
                            <div
                              className={cn(
                                "mb-1 flex items-center gap-2 text-xs",
                                isBot
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/80"
                              )}
                            >
                              <Scale className="h-3 w-3" />
                              <span>Example</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground/90">
                              <ReactMarkdown>{section.example}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Full Legal Text */}
                        {section.legal_text && (
                          <div>
                            <div
                              className={cn(
                                "mb-1 flex items-center gap-2 text-xs",
                                isBot
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/80"
                              )}
                            >
                              <FileText className="h-3 w-3" />
                              <span>Full Legal Text</span>
                            </div>
                            <div
                              className={cn(
                                "prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md p-3 font-mono text-xs leading-relaxed",
                                isBot
                                  ? "bg-muted text-foreground/80"
                                  : "bg-black/20 text-primary-foreground/90"
                              )}
                            >
                              {section.legal_text}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
