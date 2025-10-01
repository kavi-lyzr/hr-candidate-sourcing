# Frontend Integration Guide
## Connecting the Search Page to Real Agents

This guide will help you update `src/app/page.tsx` to work with the real backend agents.

---

## Step-by-Step Implementation

### 1. Update Imports

Add these imports at the top of `page.tsx`:

```typescript
import { useAuth } from '@/lib/AuthProvider'; // If using Lyzr Auth
// or use next-auth's useSession if you're using that
```

### 2. Create SSE Hook

Create a custom hook for SSE connections (`src/hooks/use-sse.ts`):

```typescript
import { useEffect, useRef, useState } from 'react';

export function useSSE(sessionId: string | null) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`/api/chat/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE Connected');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        console.log('Stream complete');
        setIsDone(true);
        eventSource.close();
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('Connected to session:', data.sessionId);
        } else if (data.type === 'chunk') {
          setMessages(prev => [...prev, data.data]);
        } else if (data.type === 'error') {
          console.error('Stream error:', data.error);
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  return { messages, isConnected, isDone };
}
```

### 3. Update the Search Handler

Replace the existing `handleSearch` function:

```typescript
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
const { messages: sseMessages, isDone } = useSSE(currentSessionId);

const handleSearch = async () => {
  if (!searchQuery.trim()) return;

  // Add user message to UI
  const userMessage: Message = {
    id: Date.now().toString(),
    content: searchQuery.trim(),
    role: 'user',
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);
  setShowChat(true);

  try {
    // 1. Start search with backend
    const response = await fetch('/api/chat/start-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery.trim(),
        jdId: selectedJD || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start search');
    }

    const { sessionId } = await response.json();
    
    // 2. Connect to SSE stream
    setCurrentSessionId(sessionId);

  } catch (error) {
    console.error('Error during search:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "I'm sorry, I encountered an error while searching. Please try again.",
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMessage]);
    setIsLoading(false);
  }

  setSearchQuery("");
};
```

### 4. Process SSE Messages

Add an effect to process incoming SSE messages:

```typescript
useEffect(() => {
  if (!isDone || sseMessages.length === 0) return;

  // Combine all SSE chunks into full response
  const fullResponse = sseMessages.join('');
  
  // Parse candidates from markdown links: [Name](public_id)
  const candidateRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const candidates: any[] = [];
  let match;

  while ((match = candidateRegex.exec(fullResponse)) !== null) {
    candidates.push({
      id: match[2], // public_id
      name: match[1], // Full name
      public_id: match[2],
    });
  }

  // Create AI response message
  const aiResponse: Message = {
    id: Date.now().toString(),
    content: fullResponse,
    role: 'assistant',
    timestamp: new Date(),
    candidates: candidates.length > 0 ? candidates.map(c => ({
      ...c,
      title: 'Loading...', // Will be populated later
      company: 'Loading...',
      location: 'Loading...',
      summary: 'Loading...',
    })) : undefined,
  };

  setMessages(prev => [...prev, aiResponse]);
  setIsLoading(false);
  
  // Reset session for next search
  setCurrentSessionId(null);

}, [isDone, sseMessages]);
```

### 5. Show Streaming Progress

Add a real-time streaming indicator:

```typescript
// In your JSX, replace the loading state with:
{isLoading && (
  <div className="flex gap-4 justify-start animate-fade-in-up">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
      <Bot className="h-4 w-4 text-primary" />
    </div>
    <div className="bg-muted/60 border border-border/30 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xl">
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-sm text-muted-foreground">AI is thinking...</span>
      </div>
      {sseMessages.length > 0 && (
        <p className="text-sm text-foreground">
          {sseMessages.join('')}
        </p>
      )}
    </div>
  </div>
)}
```

### 6. Fetch Full Candidate Details

After receiving candidate public_ids, fetch their full details:

```typescript
// Add this function
const fetchCandidateDetails = async (publicIds: string[]) => {
  try {
    const response = await fetch('/api/candidates/get-by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicIds }),
    });

    if (response.ok) {
      const candidates = await response.json();
      return candidates;
    }
  } catch (error) {
    console.error('Failed to fetch candidate details:', error);
  }
  return [];
};

// Call this after parsing candidates from SSE
useEffect(() => {
  if (!isDone || sseMessages.length === 0) return;

  const processResponse = async () => {
    const fullResponse = sseMessages.join('');
    const candidateRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const publicIds: string[] = [];
    let match;

    while ((match = candidateRegex.exec(fullResponse)) !== null) {
      publicIds.push(match[2]);
    }

    // Fetch full details
    const candidateDetails = await fetchCandidateDetails(publicIds);

    const aiResponse: Message = {
      id: Date.now().toString(),
      content: fullResponse,
      role: 'assistant',
      timestamp: new Date(),
      candidates: candidateDetails,
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
    setCurrentSessionId(null);
  };

  processResponse();
}, [isDone, sseMessages]);
```

### 7. Create Candidate Details Endpoint

Create `src/app/api/candidates/get-by-ids/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CandidateProfile from '@/models/candidateProfile';

export async function POST(request: Request) {
  try {
    const { publicIds } = await request.json();

    if (!Array.isArray(publicIds)) {
      return NextResponse.json({ error: 'publicIds must be an array' }, { status: 400 });
    }

    await connectDB();

    const profiles = await CandidateProfile.find({
      publicId: { $in: publicIds }
    });

    const formatted = profiles.map(profile => {
      const data = profile.rawData;
      return {
        id: data.public_id,
        name: data.full_name,
        title: data.job_title,
        company: data.company,
        location: data.location,
        education: data.educations?.[0]?.school || '',
        summary: data.about?.substring(0, 150) || '',
        companyLogo: data.company_logo_url,
        profilePic: data.profile_image_url,
        linkedinUrl: data.linkedin_url,
        public_id: data.public_id,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Testing the Integration

### 1. Start Development Server

```bash
npm run dev
```

### 2. Open Browser DevTools

- Go to Network tab
- Filter by type: `eventsource`
- You should see the SSE connection when you search

### 3. Test Search Flow

1. Enter a search query (e.g., "Software engineers in San Francisco")
2. Watch the Network tab for:
   - POST to `/api/chat/start-search`
   - EventSource connection to `/api/chat/stream/[sessionId]`
3. Check Console for logs:
   - SSE connection status
   - Incoming message chunks
   - Parsed candidates

### 4. Common Issues

**SSE Not Connecting:**
- Check if sessionId is valid
- Verify authentication is working
- Look for CORS errors

**No Messages Received:**
- Check backend logs for agent errors
- Verify LinkedIn API credentials
- Check if agent is calling the tool

**Candidates Not Displaying:**
- Check regex parsing of markdown links
- Verify database has candidate profiles
- Check `/api/candidates/get-by-ids` response

---

## Production Considerations

### 1. Error Handling

Add comprehensive error handling:

```typescript
eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  
  // Show user-friendly error
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    content: "Connection lost. Please try searching again.",
    role: 'assistant',
    timestamp: new Date(),
  }]);
  
  setIsLoading(false);
  eventSource.close();
};
```

### 2. Retry Logic

Implement automatic retries for failed searches:

```typescript
const MAX_RETRIES = 3;
let retryCount = 0;

const handleSearchWithRetry = async () => {
  try {
    await handleSearch();
    retryCount = 0; // Reset on success
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retry ${retryCount}/${MAX_RETRIES}`);
      setTimeout(handleSearchWithRetry, 2000 * retryCount);
    } else {
      // Show error to user
      console.error('Max retries reached');
    }
  }
};
```

### 3. Loading States

Show different loading states:

```typescript
const [loadingState, setLoadingState] = useState<
  'idle' | 'starting' | 'searching' | 'processing' | 'done'
>('idle');

// Update throughout the search process
setLoadingState('starting'); // When calling start-search
setLoadingState('searching'); // When SSE connected
setLoadingState('processing'); // When parsing results
setLoadingState('done'); // When complete
```

### 4. Analytics

Track search events:

```typescript
// After successful search
fetch('/api/analytics/event', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'CANDIDATE_SEARCH_COMPLETED',
    metadata: {
      query: searchQuery,
      candidatesFound: candidates.length,
      duration: searchDuration,
    }
  })
});
```

---

## Next Steps

1. ✅ Implement SSE hook
2. ✅ Update search handler
3. ✅ Add streaming UI
4. ✅ Create candidate details endpoint
5. ✅ Test end-to-end flow
6. 🔲 Implement save profile feature
7. 🔲 Add search history
8. 🔲 Implement conversation continuation

Good luck! 🚀

