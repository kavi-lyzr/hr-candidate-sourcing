'use client';

import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/80">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to Lyzr HR
            </h1>
            <p className="text-muted-foreground">
              Please authenticate to access the candidate sourcing platform.
            </p>
          </div>
          <Button onClick={login} size="lg" className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In with Lyzr
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
