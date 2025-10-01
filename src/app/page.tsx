"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, School, MapPin, Settings, Bookmark, Sparkles, History, RefreshCw, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDialog } from "@/components/filter-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthProvider";
import { useSSE } from "@/hooks/use-sse";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  candidates?: Array<{
    id: string;
    name: string;
    title: string;
    company: string;
    location: string;
    education?: string;
    summary: string;
    companyLogo?: string;
    profilePic?: string;
    linkedinUrl?: string;
    public_id: string;
  }>;
}

export default function Home() {
  const { isAuthenticated, userId, email, displayName } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [selectedJD, setSelectedJD] = useState("");
  const [jdDropdownOpen, setJdDropdownOpen] = useState(false);
  const [availableJDs, setAvailableJDs] = useState<Array<{id: string, name: string}>>([]);
  const [isClient, setIsClient] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    sessionId: string;
    title: string;
    messageCount: number;
    lastUpdated: string;
    createdAt: string;
  }>>([]);
  
  // SSE State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { messages: sseMessages, isDone, error: sseError } = useSSE(currentSessionId);
  
  const placeholderTexts = useMemo(() => [
    selectedJD ? "Find candidates who match this job description" : "Software engineers in the Bay Area with 2+ years of experience building AI Agents on Lyzr",
    selectedJD ? "Discover talent that fits your requirements perfectly" : "Data scientists in New York with 3+ years of experience in machine learning and Python",
    selectedJD ? "Source the best candidates for this role" : "Product managers in Seattle with 4+ years of experience in SaaS companies",
    selectedJD ? "Find qualified professionals for your team" : "DevOps engineers in Austin with 2+ years of experience in cloud infrastructure"
  ], [selectedJD]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

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
      console.log('[Chat] Sending message:', searchQuery);
      
      // Check if user is authenticated
      if (!isAuthenticated || !userId || !email) {
        throw new Error('User not authenticated');
      }

      // Call non-streaming chat API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          jdId: selectedJD || null,
          user: {
            id: userId,
            email: email,
            name: displayName
          },
          sessionId: currentSessionId, // Use existing session for follow-ups
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { response: agentResponse, sessionId } = await response.json();
      console.log('[Chat] Received response, session:', sessionId);
      
      // Set session ID if this is a new conversation
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }

      // Parse candidates from markdown links: [Name](public_id)
      const candidateRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const publicIds: string[] = [];
      let match;

      while ((match = candidateRegex.exec(agentResponse)) !== null) {
        publicIds.push(match[2]); // public_id
      }

      console.log('[Chat] Found candidate links:', publicIds);

      let candidates = [];

      // Fetch full candidate details if we found any
      if (publicIds.length > 0) {
        console.log('[Chat] Fetching candidate details...');
        const candidatesResponse = await fetch('/api/candidates/get-by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicIds }),
        });

        if (candidatesResponse.ok) {
          candidates = await candidatesResponse.json();
          console.log('[Chat] Fetched', candidates.length, 'candidate details');
        } else {
          console.error('[Chat] Failed to fetch candidate details');
        }
      }

      // Create AI response message
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse,
        role: 'assistant',
        timestamp: new Date(),
        candidates: candidates.length > 0 ? candidates : undefined,
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      
      // Reload conversation history
      loadConversationHistory();

    } catch (error) {
      console.error('[Chat] Error:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm sorry, I encountered an error. Please try again. (${error})`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }

    setSearchQuery("");
  };

  const handleFollowUp = async (message: string) => {
    if (!message.trim()) return;
    
    // Set the search query and trigger handleSearch
    setSearchQuery(message);
    // Trigger search in next tick to ensure state is updated
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  const deleteConversation = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        }
      });

      if (response.ok) {
        toast.success('Conversation deleted');
        
        // If we're deleting the current session, reset the UI
        if (sessionId === currentSessionId) {
          setMessages([]);
          setShowChat(false);
          setCurrentSessionId(null);
        }
        
        // Reload history
        loadConversationHistory();
      } else {
        toast.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Process SSE messages when stream is complete
  useEffect(() => {
    if (!isDone || sseMessages.length === 0) return;

    const processStreamResponse = async () => {
      console.log('[SSE] Processing complete stream:', sseMessages);
      
      try {
        // Combine all SSE chunks into full response
        const fullResponse = sseMessages.join('');
        
        // Parse candidates from markdown links: [Name](public_id)
        const candidateRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const publicIds: string[] = [];
        let match;

        while ((match = candidateRegex.exec(fullResponse)) !== null) {
          publicIds.push(match[2]); // public_id
        }

        console.log('[SSE] Found candidate links:', publicIds);

        let candidates = [];

        // Fetch full candidate details if we found any
        if (publicIds.length > 0) {
          console.log('[SSE] Fetching candidate details...');
          const response = await fetch('/api/candidates/get-by-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds }),
          });

          if (response.ok) {
            candidates = await response.json();
            console.log('[SSE] Fetched', candidates.length, 'candidate details');
          } else {
            console.error('[SSE] Failed to fetch candidate details');
            toast.error('Failed to load candidate details');
          }
        }

        // Create AI response message
        const aiResponse: Message = {
          id: Date.now().toString(),
          content: fullResponse,
          role: 'assistant',
          timestamp: new Date(),
          candidates: candidates.length > 0 ? candidates : undefined,
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        
        // Reload conversation history to include the new conversation
        loadConversationHistory();
        
        console.log('[SSE] Stream processing complete');
      } catch (error) {
        console.error('[SSE] Error processing stream:', error);
        toast.error('Failed to process search results');
        setIsLoading(false);
        setCurrentSessionId(null);
      }
    };

    processStreamResponse();
  }, [isDone, sseMessages]);

  // Handle SSE errors
  useEffect(() => {
    if (sseError) {
      console.error('[SSE] Stream error:', sseError);
      toast.error(sseError);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Connection lost. Please try searching again.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setCurrentSessionId(null);
    }
  }, [sseError]);

  // Load conversation history on mount
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadConversationHistory();
    }
  }, [isAuthenticated, userId]);

  const loadConversationHistory = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/chat/history?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversationHistory(data.sessions || []);
        console.log(`Loaded ${data.sessions?.length || 0} conversation(s)`);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const resetConversation = () => {
    // Don't save empty conversations
    if (messages.length > 0 && currentSessionId) {
      // Conversation is already saved in database, just reload history
      loadConversationHistory();
    }
    
    setMessages([]);
    setShowChat(false);
    setIsLoading(false);
    setCurrentSessionId(null);
  };

  const loadConversation = async (sessionId: string) => {
    try {
      console.log(`Loading conversation: ${sessionId}`);
      
      const response = await fetch(`/api/chat/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const session = data.session;
        
        // Convert conversation history to messages
        const loadedMessages: Message[] = session.conversationHistory.map((msg: any, index: number) => ({
          id: `${sessionId}-${index}`,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp),
          // TODO: Load candidates if they were saved
        }));

        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        setShowChat(true);
        
        console.log(`Loaded ${loadedMessages.length} messages`);
      } else {
        toast.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleFilterSave = () => {
    setFilterDialogOpen(false);
    // In the chatbot UI, filters would be applied to refine the search
    // For now, just close the dialog
  };

  // Typing animation effect - only on client
  useEffect(() => {
    if (!isClient || searchQuery.trim()) return; // Don't animate if user has typed something
    
    const currentText = placeholderTexts[currentTextIndex];
    
    if (isTyping) {
      if (charIndex < currentText.length) {
        const timer = setTimeout(() => {
          setPlaceholderText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 50);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      if (charIndex > 0) {
        const timer = setTimeout(() => {
          setPlaceholderText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 30);
        return () => clearTimeout(timer);
      } else {
        setCurrentTextIndex((currentTextIndex + 1) % placeholderTexts.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, currentTextIndex, searchQuery, placeholderTexts, isClient]);


  // Load JDs from API only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchJDs = async () => {
      try {
        const response = await fetch('/api/jds');
        if (response.ok) {
          const jds = await response.json();
          setAvailableJDs(jds.map((jd: { _id: string; title: string }) => ({ id: jd._id, name: jd.title })));
        } else {
          console.error('Failed to fetch JDs:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching JDs:', error);
      }
    };

    setIsClient(true);
    fetchJDs();
  }, [isAuthenticated]);

  if (showChat) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        {/* Chat Interface */}
        <div className="flex flex-col h-screen">
          {/* Fixed Header with Controls */}
          <div className="fixed top-32 right-4 z-30 flex items-center gap-2">
            {/* History dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
                {conversationHistory.length > 0 ? (
                  <>
                    {conversationHistory.map((conversation) => (
                      <DropdownMenuItem
                        key={conversation.sessionId}
                        className="flex items-center justify-between gap-2 p-3 cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div 
                          className="flex-1 flex flex-col items-start gap-1"
                          onClick={() => loadConversation(conversation.sessionId)}
                        >
                          <div className="font-medium text-sm truncate w-full">
                            {conversation.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(conversation.lastUpdated).toLocaleDateString()} • {conversation.messageCount} messages
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.sessionId);
                          }}
                        >
                          ×
                        </Button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={resetConversation}
                      className="gap-2 cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      New Conversation
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem disabled className="text-center text-muted-foreground">
                    No conversations yet
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetConversation}
              className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto pt-4 pb-32">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 border border-border/30 backdrop-blur-sm'
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {message.content}
                    </p>
                    {message.candidates && (
                      <div className="mt-4 space-y-4">
                        <h4 className="font-semibold text-primary mb-3">Top Recommendations</h4>
                        {message.candidates.slice(0, 3).map((candidate) => (
                          <div key={candidate.id} className="border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
                            <div className="flex items-start space-x-3">
                              <Image
                                src={candidate.profilePic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                                alt={candidate.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover flex-shrink-0"
                              />
                  <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-semibold text-primary hover:text-primary/80 cursor-pointer">{candidate.name}</h5>
                                  <a href="#" className="hover:opacity-80 transition-opacity">
                          <Image 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/1024px-LinkedIn_icon.svg.png" 
                            alt="LinkedIn" 
                                      width={16}
                                      height={16}
                          />
                        </a>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                                  {candidate.companyLogo && (
                        <Image 
                          src={candidate.companyLogo} 
                          alt={candidate.company} 
                          width={16}
                          height={16}
                          className="w-4 h-4 object-contain"
                        />
                                  )}
                                  <p className="text-sm text-foreground font-medium">{candidate.title}</p>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">{candidate.location}</p>
                    </div>
                    {candidate.education && (
                      <div className="flex items-center space-x-2 mb-2">
                                    <School className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">{candidate.education}</p>
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="flex items-start space-x-2">
                                    <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                                    <p className="text-sm text-muted-foreground italic">{candidate.summary}</p>
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/5 flex-shrink-0">
                                <Bookmark className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* All Profiles Section */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-foreground">All Profiles ({message.candidates.length})</h4>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-muted-foreground">1 - {message.candidates.length} of {message.candidates.length}</div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFilterDialogOpen(true)}
                                className="text-primary border-primary hover:bg-primary/5"
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Edit Filters
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {message.candidates.map((candidate) => (
                              <div key={candidate.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-card hover:bg-card/80 transition-colors">
                                <Image
                                  src={candidate.profilePic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                                  alt={candidate.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h5 className="font-semibold text-primary hover:text-primary/80 cursor-pointer truncate">{candidate.name}</h5>
                                    <a href="#" className="hover:opacity-80 transition-opacity flex-shrink-0">
                                      <Image
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/1024px-LinkedIn_icon.svg.png"
                                        alt="LinkedIn"
                                        width={14}
                                        height={14}
                                      />
                                    </a>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{candidate.title}</p>
                                </div>
                                <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/5 flex-shrink-0">
                                  <Bookmark className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                            ))}
                        </div>
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'opacity-60 text-primary-foreground/60'
                        : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start animate-fade-in-up">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/60 border border-border/30 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {sseMessages.length === 0 ? 'Connecting to AI agent...' : 'Searching LinkedIn...'}
                      </span>
                    </div>
                    {sseMessages.length > 0 && (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {sseMessages.join('')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Area at Bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {selectedJD && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                        @{selectedJD}
                        <button
                          onClick={() => setSelectedJD("")}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  )}
                  <Input
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                    className={`h-12 text-base ${selectedJD ? 'pl-28' : 'pl-4'} pr-4 border-2 border-border focus:border-primary rounded-lg ${isLoading ? 'opacity-50' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value;
                        if (value.trim()) {
                          handleFollowUp(value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Ask a follow-up question..."]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleFollowUp(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isLoading}
                  className="h-12 px-6"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dialog */}
        <FilterDialog 
          open={filterDialogOpen} 
          onOpenChange={setFilterDialogOpen}
          onSaveChanges={() => setFilterDialogOpen(false)}
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-4 animate-fade-in-up">
        {/* Header Section */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-16 flex items-center justify-center">
              <Image 
                src="https://i0.wp.com/www.lyzr.ai/wp-content/uploads/2024/11/cropped_lyzr_logo_1.webp?fit=452%2C180&ssl=1" 
                alt="Lyzr Logo" 
                width={80}
                height={48}
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lyzr HR Candidate Sourcing Agent
          </h1>
          <p className="text-muted-foreground text-lg">
            Find exactly who you&apos;re looking for, in seconds. 
            <span className="text-primary cursor-pointer hover:underline ml-1">
              See how it works.
            </span>
          </p>
        </div>

        {/* Clean Search Interface */}
        <div className="w-full max-w-3xl space-y-4 animate-fade-in-up">

          {/* Main Search Input */}
          <div className="relative">
            <div className="relative">
              {selectedJD && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                    @{selectedJD}
                    <button
                      onClick={() => setSelectedJD("")}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            <Input
              placeholder={searchQuery.trim() ? "" : (isClient ? placeholderText : "Search for candidates...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-14 text-base ${selectedJD ? 'pl-32' : 'pl-4'} pr-24 border-2 border-border focus:border-primary rounded-lg shadow-sm`}
            />
            </div>
            <div className="absolute right-2 top-2">
              <Button 
                className="h-10 px-6"
                disabled={!searchQuery.trim()}
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
          
          {/* Select JD Button */}
          <div className="flex justify-end">
            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => setJdDropdownOpen(!jdDropdownOpen)}
                className="flex items-center space-x-2"
              >
                {selectedJD || "Select JD"}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {jdDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-10 min-w-48">
                  <div className="p-2">
                    {availableJDs.length === 0 ? (
                      <>
                        <div className="text-sm text-muted-foreground p-2">No JDs uploaded yet</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-primary"
                          onClick={() => window.location.href = '/jd-library'}
                        >
                          Upload JD in JD Library
                        </Button>
                      </>
                    ) : (
                      <>
                        {availableJDs.map((jd) => (
                          <Button
                            key={jd.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start truncate max-w-full"
                            onClick={() => {
                              setSelectedJD(jd.name);
                              setJdDropdownOpen(false);
                            }}
                          >
                            {jd.name}
                          </Button>
                        ))}
                        <hr className="my-1" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-primary"
                          onClick={() => window.location.href = '/jd-library'}
                        >
                          Manage JD Library
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Filter Dialog */}
      <FilterDialog 
        open={filterDialogOpen} 
        onOpenChange={setFilterDialogOpen}
        onSaveChanges={handleFilterSave}
      />
    </div>
  );
}
