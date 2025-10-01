import { ReactNode } from "react";

interface ChatEmptyStateProps {
  children: ReactNode;
}

export function ChatEmptyState({ children }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-4">
      <div className="w-full max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome to HR Assistant
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Get instant answers to your HR questions. Ask about policies, benefits, procedures, and more.
          </p>
        </div>
        
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
