"use client";

import { useEffect } from "react";

interface GradientManagerProps {
  hasMessages: boolean;
}

/**
 * Component that manages the animated gradient background based on conversation state
 * Shows gradient when no conversation is active, hides it when conversation starts
 */
export function GradientManager({ hasMessages }: GradientManagerProps) {
  useEffect(() => {
    // Enable gradient by default for AI Assistant
    document.body.classList.add('gradient-enabled');
    
    if (hasMessages) {
      // Remove gradient when conversation starts
      document.body.classList.add('no-gradient-background');
      document.getElementById('white-gradient')?.classList.add('opacity-10');
    } else {
      // Show gradient when no conversation (remove override to use default)
      document.body.classList.remove('no-gradient-background');
      document.getElementById('white-gradient')?.classList.remove('opacity-10');
    }
    
    // Cleanup function to ensure proper state when component unmounts
    return () => {
      document.body.classList.remove('no-gradient-background');
      document.body.classList.remove('gradient-enabled');
    };
  }, [hasMessages]);

  return null; // This component doesn't render anything
}
