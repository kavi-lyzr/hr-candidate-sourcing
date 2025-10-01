'use client';

import { useAuth } from '@/lib/AuthProvider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className={`flex h-full w-full transition-all duration-300 ${!isAuthenticated && !isLoading ? 'blur-sm pointer-events-none' : ''}`}>
      {children}
    </div>
  );
}
