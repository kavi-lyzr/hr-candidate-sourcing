'use client';

import { useToast } from '@/components/ui/use-toast';

// A wrapper around the shadcn toast hook to also log to our backend
export function useAppToast() {
  const { toast: originalToast } = useToast();

  const appToast = (props: any) => {
    // Show the original toast
    originalToast(props);

    // If it's an error, log it to the backend
    if (props.variant === 'destructive') {
      try {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: props.title || 'Error',
            type: 'error',
            metadata: { description: props.description },
          }),
        });
      } catch (error) {
        console.error("Failed to log notification:", error);
      }
    }
  };

  return { toast: appToast };
}
