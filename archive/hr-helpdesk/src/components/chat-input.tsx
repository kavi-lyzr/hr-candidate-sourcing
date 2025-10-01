"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSend, 
  isLoading = false, 
  placeholder = "Ask a question about HR policies, benefits, or procedures..." 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = "auto";
      // Set height based on content, with min and max constraints
      const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 120));
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end gap-4 p-4 bg-background border border-border/60 rounded-[32px] backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[24px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-1 px-0 text-sm placeholder:text-muted-foreground/60 leading-relaxed"
            style={{ height: "24px" }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || isLoading}
            className="h-9 w-9 p-0 shrink-0 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className={"transition-opacity text-xs text-muted-foreground/60 mt-3 px-4 text-center "+(message.trim() ? "":"opacity-0")}>
            Press Enter to send, Shift+Enter for new line
          </p>
        {/* {message.trim() && (
          
        )} */}
      </form>
    </div>
  );
}
