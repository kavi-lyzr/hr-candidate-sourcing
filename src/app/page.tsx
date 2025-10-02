"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, School, MapPin, Settings, Bookmark, Sparkles, History, RefreshCw, User, Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDialog } from "@/components/filter-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthProvider";
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

  // Session State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 10;

  // Helper function to render message content with clickable candidate names
  const renderMessageContent = (content: string) => {
    // Parse markdown links: [Name](public_id)
    const parts = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add the clickable link
      const name = match[1];
      const publicId = match[2];
      const linkedinUrl = `https://www.linkedin.com/in/${publicId}`;
      
      parts.push(
        <a
          key={match.index}
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {name}
        </a>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };
  
  const placeholderTexts = useMemo(() => [
    selectedJD ? "Find candidates who match this job description" : "Software engineers in the Bay Area with 2+ years of experience building AI Agents on Lyzr",
    selectedJD ? "Discover talent that fits your requirements perfectly" : "Data scientists in New York with 3+ years of experience in machine learning and Python",
    selectedJD ? "Source the best candidates for this role" : "Product managers in Seattle with 4+ years of experience in SaaS companies",
    selectedJD ? "Find qualified professionals for your team" : "DevOps engineers in Austin with 2+ years of experience in cloud infrastructure"
  ], [selectedJD]);
  
  const handleSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowChat(true);

    try {
      console.log('[Chat] Sending message:', query);
      
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
          query: query.trim(),
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

      const responseData = await response.json();
      const { response: agentResponse, sessionId } = responseData;
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

      // Try to get candidate data from the tool response first (if available)
      // This ensures we show ALL profiles that were fetched, not just the ones the agent mentioned
      if (responseData && responseData.all_profiles) {
        console.log('[Chat] Using profile data from tool response:', responseData.all_profiles.length, 'profiles');
        candidates = responseData.all_profiles.map((profile: any) => ({
          id: profile.public_id,
          name: profile.full_name,
          title: profile.job_title || 'No title available',
          company: profile.company || 'No company',
          location: profile.location || 'Location not specified',
          education: profile.education?.[0]?.school || '',
          summary: profile.about || 'No summary available',
          companyLogo: profile.company_logo_url || '',
          profilePic: profile.profile_image_url
            ? `${profile.profile_image_url}?w=100&h=100&fit=crop&crop=face`
            : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          linkedinUrl: profile.linkedin_url || `https://www.linkedin.com/in/${profile.public_id}`,
          public_id: profile.public_id,
        }));
      } else if (publicIds.length > 0) {
        // Fallback: fetch candidate details from database
        console.log('[Chat] Fetching candidate details from database...');
        const candidatesResponse = await fetch('/api/candidates/get-by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicIds }),
        });

        if (candidatesResponse.ok) {
          const dbCandidates = await candidatesResponse.json();
          candidates = dbCandidates.map((candidate: any) => ({
            ...candidate,
            profilePic: candidate.profile_image_url
              ? `${candidate.profile_image_url}?w=100&h=100&fit=crop&crop=face`
              : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            linkedinUrl: candidate.linkedin_url || `https://www.linkedin.com/in/${candidate.public_id}`,
          }));
          console.log('[Chat] Fetched', candidates.length, 'candidate details from database');
        } else {
          console.error('[Chat] Failed to fetch candidate details from database');
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
    
    // Clear search query and directly call handleSearch with the message
    setSearchQuery("");
    await handleSearch(message);
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
    setCurrentPage(1); // Reset pagination
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
        setCurrentPage(1); // Reset pagination for new conversation

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
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {message.role === 'assistant' ? renderMessageContent(message.content) : message.content}
                    </div>
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
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
                                }}
                              />
                  <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <a 
                                    href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                  >
                                    {candidate.name}
                                  </a>
                                  <a 
                                    href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80 transition-opacity"
                                  >
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
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
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

                        {/* All Profiles Section with Pagination */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-foreground">All Profiles ({message.candidates?.length || 0})</h4>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-muted-foreground">
                                {message.candidates && (
                                  <>
                                    {Math.min((currentPage - 1) * profilesPerPage + 1, message.candidates.length)} - {Math.min(currentPage * profilesPerPage, message.candidates.length)} of {message.candidates.length}
                                  </>
                                )}
                              </div>
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

                          {/* Pagination Controls */}
                          {message.candidates && message.candidates.length > profilesPerPage && (
                            <div className="flex items-center justify-center mb-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>

                                <div className="flex items-center space-x-1">
                                  {message.candidates && Array.from({ length: Math.min(5, Math.ceil(message.candidates.length / profilesPerPage)) }, (_, i) => {
                                    const pageNumber = Math.max(1, Math.min(
                                      currentPage - 2 + i,
                                      Math.ceil(message.candidates.length / profilesPerPage)
                                    ));
                                    return (
                                      <Button
                                        key={pageNumber}
                                        variant={currentPage === pageNumber ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className="min-w-8"
                                      >
                                        {pageNumber}
                                      </Button>
                                    );
                                  })}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => message.candidates ? Math.min(Math.ceil(message.candidates.length / profilesPerPage), prev + 1) : prev)}
                                  disabled={currentPage === (message.candidates ? Math.ceil(message.candidates.length / profilesPerPage) : 1)}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            {(() => {
                              if (!message.candidates) return null;

                              const startIndex = (currentPage - 1) * profilesPerPage;
                              const endIndex = startIndex + profilesPerPage;
                              const paginatedCandidates = message.candidates.slice(startIndex, endIndex);

                              return paginatedCandidates.map((candidate) => (
                              <div key={candidate.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-card hover:bg-card/80 transition-colors">
                                <Image
                                  src={candidate.profilePic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                                  alt={candidate.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <a 
                                      href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-semibold text-primary hover:text-primary/80 hover:underline truncate"
                                    >
                                      {candidate.name}
                                    </a>
                                    <a 
                                      href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:opacity-80 transition-opacity flex-shrink-0"
                                    >
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
                              ));
                            })()}
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
                        Searching for candidates...
                      </span>
                    </div>
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
                onClick={() => handleSearch()}
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
