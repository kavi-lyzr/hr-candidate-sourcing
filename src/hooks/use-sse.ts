import { useEffect, useRef, useState } from 'react';

export function useSSE(sessionId: string | null) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setIsConnected(false);
      setIsDone(false);
      setError(null);
      return;
    }

    console.log(`[SSE] Connecting to session: ${sessionId}`);
    const token = process.env.NEXT_PUBLIC_API_AUTH_TOKEN;
    // Encode the token to handle special characters
    const encodedToken = encodeURIComponent(token || '');
    const eventSource = new EventSource(`/api/chat/stream/${sessionId}?token=${encodedToken}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        console.log('[SSE] Stream completed');
        setIsDone(true);
        eventSource.close();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('[SSE] Connected to session:', data.sessionId);
        } else if (data.type === 'chunk') {
          console.log('[SSE] Received chunk:', data.data);
          setMessages(prev => [...prev, data.data]);
        } else if (data.type === 'error') {
          console.error('[SSE] Stream error:', data.error);
          setError(data.error);
          setIsDone(true);
          eventSource.close();
        }
      } catch (error) {
        console.error('[SSE] Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setError('Connection lost. Please try again.');
      setIsConnected(false);
      setIsDone(true);
      eventSource.close();
    };

    // Cleanup function
    return () => {
      console.log('[SSE] Cleaning up connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sessionId]);

  return { messages, isConnected, isDone, error };
}

