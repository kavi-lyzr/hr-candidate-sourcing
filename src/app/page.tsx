/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { ChevronDown, School, MapPin, Settings, Bookmark, Sparkles, History, RefreshCw, User, Bot, ChevronLeft, ChevronRight, Send, CheckCircle, Target, MapPin as MapPinIcon, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FilterDialog } from "@/components/filter-dialog";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import { CandidateHoverCard } from "@/components/CandidateHoverCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthProvider";
import { toast } from "sonner";

const DEFAULT_DEMO_URL = 'https://www.linkedin.com/posts/vidur-rajpal-2b143b1a8_juicebox-just-raised-30m-series-a-to-solve-ugcPost-7382782038371790848-BmmF';

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
    // profilePic?: string; // Removed - LinkedIn API returns empty strings
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
  const [selectedJD, setSelectedJD] = useState<{ id: string, name: string } | null>(null);
  const [jdDropdownOpen, setJdDropdownOpen] = useState(false);
  const [availableJDs, setAvailableJDs] = useState<Array<{ id: string, name: string }>>([]);
  const [isClient, setIsClient] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    sessionId: string;
    title: string;
    messageCount: number;
    lastUpdated: string;
    createdAt: string;
    attachedJdTitle?: string;
  }>>([]);

  // Session State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<Set<string>>(new Set());
  const [currentSessionJdTitle, setCurrentSessionJdTitle] = useState<string | null>(null);

  // Calculate dynamic padding for JD tag
  const getJdTagPadding = (jdTitle: string) => {
    // Base padding for the tag container + some buffer
    const basePadding = 16; // pl-4 = 16px
    const tagPadding = 16; // px-2 = 8px on each side, so 16px total
    const closeButtonWidth = 24; // X button + padding
    const buffer = 24; // Small buffer for visual spacing

    // More accurate character width calculation
    // Most characters are ~6-7px wide, but some are wider (W, M) and some narrower (i, l)
    const avgCharWidth = 6.5;
    const textWidth = jdTitle.length * avgCharWidth;
    const totalTagWidth = textWidth + tagPadding + closeButtonWidth + buffer;

    // Cap the maximum width to prevent extremely long tags
    const maxTagWidth = 280;
    const actualTagWidth = Math.min(totalTagWidth, maxTagWidth);

    // Ensure minimum padding for very short titles
    const minPadding = 80; // Minimum reasonable padding

    // Return padding in pixels
    return Math.max(Math.ceil(actualTagWidth), minPadding);
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 5;

  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [candidateDetailsCache, setCandidateDetailsCache] = useState<Map<string, any>>(new Map());
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Function to fetch full candidate details from database
  const fetchCandidateDetails = async (publicId: string) => {
    // Check cache first
    if (candidateDetailsCache.has(publicId)) {
      console.log('[Modal] Using cached details for:', publicId);
      return candidateDetailsCache.get(publicId);
    }

    try {
      console.log('[Modal] Fetching details for:', publicId);
      const response = await fetch('/api/candidates/get-by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: [publicId] }),
      });

      if (response.ok) {
        const candidates = await response.json();
        console.log('[Modal] API Response:', candidates);

        if (Array.isArray(candidates) && candidates.length > 0) {
          const fullCandidate = candidates[0];
          // Cache the result
          setCandidateDetailsCache(prev => new Map(prev).set(publicId, fullCandidate));
          console.log('[Modal] Successfully fetched and cached details');
          return fullCandidate;
        }
      } else {
        console.error('[Modal] API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[Modal] Error fetching candidate details:', error);
    }
    return null;
  };

  // Function to open detail modal
  const openCandidateDetail = async (candidate: any) => {
    console.log('[Modal] Opening detail for candidate:', candidate);
    const publicId = candidate.public_id || candidate.id;

    if (!publicId) {
      console.error('[Modal] No public_id found in candidate:', candidate);
      toast.error('Unable to load candidate details');
      return;
    }

    const fullDetails = await fetchCandidateDetails(publicId);

    if (fullDetails) {
      console.log('[Modal] Setting selected candidate and opening modal');
      setSelectedCandidate(fullDetails);
      setDetailModalOpen(true);
    } else {
      // Fallback to partial data
      console.log('[Modal] Using fallback partial data');
      setSelectedCandidate(candidate);
      setDetailModalOpen(true);
    }
  };

  // Memoized pagination logic to prevent infinite re-renders
  const paginationPages = useMemo(() => {
    if (!messages.length || !messages[messages.length - 1]?.candidates) {
      return [];
    }

    const candidates = messages[messages.length - 1].candidates;
    if (!candidates) return [];

    const totalPages = Math.ceil((candidates?.length || 0) / profilesPerPage);

    if (totalPages <= 5) {
      // Show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Show current page ± 2
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    }
  }, [messages, currentPage, profilesPerPage]);

  // Helper function to render message content with clickable candidate names
  const renderMessageContent = (content: string, messageCandidates?: any[]) => {
    // Parse markdown links: [Name](url)
    // The URL can be a full URL (LinkedIn or Google search) or just a public_id
    const parts = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add the clickable link with hover card
      const name = match[1];
      const urlOrId = match[2];

      // Extract public_id from the URL
      let publicId = urlOrId;
      if (urlOrId.includes('linkedin.com/in/')) {
        // Extract from LinkedIn URL: https://www.linkedin.com/in/public-id/
        const match = urlOrId.match(/linkedin\.com\/in\/([^/]+)/);
        if (match) publicId = match[1];
      } else if (!urlOrId.startsWith('http')) {
        // It's already a public_id
        publicId = urlOrId;
      }

      // Find candidate in messageCandidates
      const candidate = messageCandidates?.find(c =>
        c.public_id === publicId || c.id === publicId
      );

      // Determine if it's a full URL or just an ID
      const finalUrl = urlOrId.startsWith('http')
        ? urlOrId
        : `https://www.linkedin.com/in/${urlOrId}`;

      const linkElement = (
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
          onClick={(e) => {
            // Prevent default if we have candidate data and can open modal
            if (candidate) {
              e.preventDefault();
              openCandidateDetail(candidate);
            }
          }}
        >
          {name}
        </a>
      );

      // Wrap with hover card if we have candidate data
      if (candidate) {
        parts.push(
          <CandidateHoverCard
            key={match.index}
            candidate={candidate}
            onViewDetails={() => openCandidateDetail(candidate)}
          >
            {linkElement}
          </CandidateHoverCard>
        );
      } else {
        parts.push(<span key={match.index}>{linkElement}</span>);
      }

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

  // Function to rank candidates based on profile quality and completeness
  const rankCandidates = (candidates: Message['candidates'], messageContent?: string) => {
    if (!candidates) return [];
    
    return [...candidates].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // HIGHEST PRIORITY: Check if the agent mentioned this candidate in the message
      // This indicates the agent found them particularly relevant
      if (messageContent) {
        const mentionsA = messageContent.includes(a.name) || messageContent.includes(a.public_id);
        const mentionsB = messageContent.includes(b.name) || messageContent.includes(b.public_id);
        
        // Get position in message (earlier = more important)
        const posA = mentionsA ? messageContent.indexOf(a.name) : Infinity;
        const posB = mentionsB ? messageContent.indexOf(b.name) : Infinity;
        
        if (mentionsA && !mentionsB) return -1; // A mentioned, B not = A wins
        if (!mentionsA && mentionsB) return 1;  // B mentioned, A not = B wins
        if (mentionsA && mentionsB) {
          // Both mentioned, earlier in message is better
          scoreA += 50 - (posA / messageContent.length) * 20; // Up to 50 points
          scoreB += 50 - (posB / messageContent.length) * 20;
        }
      }

      // Score based on profile completeness (more complete = better)
      if (a.summary && a.summary.length > 100) scoreA += 15;
      else if (a.summary && a.summary.length > 50) scoreA += 10;
      
      if (b.summary && b.summary.length > 100) scoreB += 15;
      else if (b.summary && b.summary.length > 50) scoreB += 10;

      // Score based on having education
      if (a.education) scoreA += 8;
      if (b.education) scoreB += 8;

      // Score based on having company logo (indicates verified/established company)
      if (a.companyLogo) scoreA += 5;
      if (b.companyLogo) scoreB += 5;

      // Score based on title specificity (longer, more detailed titles)
      if (a.title && a.title.length > 20) scoreA += 4;
      else if (a.title && a.title.length > 10) scoreA += 2;
      
      if (b.title && b.title.length > 20) scoreB += 4;
      else if (b.title && b.title.length > 10) scoreB += 2;

      // Score based on location specificity
      if (a.location && a.location.length > 10) scoreA += 2;
      else if (a.location && a.location.length > 5) scoreA += 1;
      
      if (b.location && b.location.length > 10) scoreB += 2;
      else if (b.location && b.location.length > 5) scoreB += 1;

      // Score based on company name presence
      if (a.company && a.company.length > 5) scoreA += 3;
      if (b.company && b.company.length > 5) scoreB += 3;

      return scoreB - scoreA; // Higher score first
    });
  };

  const handleSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    // Enhance query with JD content if JD is selected
    let enhancedQuery = query.trim();
    if (selectedJD) {
      // The JD content will be handled by the backend
      // We just need to pass the original query
      enhancedQuery = query.trim();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query.trim(), // Show original query to user
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowChat(true);

    try {
      console.log('[Chat] Sending message:', enhancedQuery);

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
          query: enhancedQuery, // Send enhanced query to API
          jdId: selectedJD?.id || null,
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
        // Set JD title for current session if JD is attached
        if (selectedJD) {
          setCurrentSessionJdTitle(selectedJD.name);
        }
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
          // profilePic: profile.profile_image_url
          //   ? `${profile.profile_image_url}?w=100&h=100&fit=crop&crop=face`
          //   : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
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
            // profilePic: candidate.profile_image_url
            //   ? `${candidate.profile_image_url}?w=100&h=100&fit=crop&crop=face`
            //   : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
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

      // Scroll to bottom after adding message
      setTimeout(() => {
        const messagesContainer = document.querySelector('.overflow-y-auto');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);

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

      // Scroll to bottom after adding error message
      setTimeout(() => {
        const messagesContainer = document.querySelector('.overflow-y-auto');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }

    setSearchQuery("");
  };

  const handleToggleSave = async (candidatePublicId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling to parent container
    if (event) {
      event.stopPropagation();
    }

    if (!currentSessionId) {
      toast.error("Cannot save profile without an active session.");
      return;
    }

    // Optimistic UI update
    const newSavedProfiles = new Set(savedProfiles);
    const isCurrentlySaved = newSavedProfiles.has(candidatePublicId);
    if (isCurrentlySaved) {
      newSavedProfiles.delete(candidatePublicId);
    } else {
      newSavedProfiles.add(candidatePublicId);
    }
    setSavedProfiles(newSavedProfiles);

    try {
      const response = await fetch('/api/profiles/toggle-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          candidatePublicId,
          sessionId: currentSessionId,
          user: {
            id: userId,
            email: email,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        throw new Error('Failed to update saved status');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update profile.');
      // Revert optimistic update on failure
      const revertedSavedProfiles = new Set(savedProfiles);
      if (isCurrentlySaved) {
        revertedSavedProfiles.add(candidatePublicId);
      } else {
        revertedSavedProfiles.delete(candidatePublicId);
      }
      setSavedProfiles(revertedSavedProfiles);
    }
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

  // Fetch saved profiles on mount
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchSavedProfiles = async () => {
      try {
        const response = await fetch(`/api/profiles/saved?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSavedProfiles(new Set(data.savedProfileIds || []));
          console.log(`Loaded ${data.savedProfileIds?.length || 0} saved profiles`);
        }
      } catch (error) {
        console.error('Error fetching saved profiles:', error);
      }
    };

    fetchSavedProfiles();
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
    setCurrentSessionJdTitle(null);
    setSelectedJD(null); // Clear the JD selection
    setCurrentPage(1); // Reset pagination
  };

  const loadConversation = async (sessionId: string) => {
    try {
      console.log(`Loading conversation: ${sessionId}`);
      setLoadingHistory(true);

      const response = await fetch(`/api/chat/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const session = data.session;

        // Extract candidate profiles from toolResults
        const allProfiles = session.toolResults?.allProfiles || [];
        console.log(`Loading conversation with ${allProfiles.length} candidate profiles`);

        // Convert conversation history to messages
        const loadedMessages: Message[] = session.conversationHistory.map((msg: any, index: number) => {
          const message: Message = {
            id: `${sessionId}-${index}`,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          };

          // Attach candidates to assistant messages that mention profiles
          if (msg.role === 'assistant' && allProfiles.length > 0) {
            // Check if this message contains candidate links
            const candidateRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            if (candidateRegex.test(msg.content)) {
              // Format candidates for display
              message.candidates = allProfiles.map((profile: any) => ({
                id: profile.public_id,
                name: profile.full_name,
                title: profile.job_title || 'No title available',
                company: profile.company || 'No company',
                location: profile.location || 'Location not specified',
                education: profile.education?.[0]?.school || '',
                summary: profile.about || 'No summary available',
                companyLogo: profile.company_logo_url || '',
                linkedinUrl: profile.linkedin_url || profile.profile_url || `https://www.linkedin.com/in/${profile.public_id}`,
                public_id: profile.public_id,
              }));
            }
          }

          return message;
        });

        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        setCurrentSessionJdTitle(session.attachedJdTitle || null);
        
        // Set the selectedJD state to display the JD tag
        if (session.attachedJd && session.attachedJdTitle) {
          setSelectedJD({
            id: session.attachedJd,
            name: session.attachedJdTitle
          });
        } else {
          setSelectedJD(null);
        }
        
        setShowChat(true);
        setCurrentPage(1); // Reset pagination for new conversation

        console.log(`Loaded ${loadedMessages.length} messages with ${allProfiles.length} candidate profiles`);
      } else {
        toast.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingHistory(false);
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
    if (!isAuthenticated || !userId) return;

    const fetchJDs = async () => {
      try {
        const response = await fetch(`/api/jds?userId=${userId}`);
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
  }, [isAuthenticated, userId]);

  if (showChat) {
    return (
      <div className="h-[calc(100vh-100px)] bg-background animate-fade-in relative overflow-hidden">
        {/* Subtle Grid Background - almost invisible in chat mode */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0 bg-grid-pattern animate-grid-flow"></div>
          {/* Radial fade overlay to reduce opacity at center */}
          <div className="absolute inset-0 bg-radial-fade"></div>
        </div>
        {/* Fixed Header with Controls */}
        <div className="fixed top-20 right-2 md:right-4 z-30 flex items-center gap-2">
          {/* History dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
              {conversationHistory.length > 0 ? (
                <>
                  {conversationHistory.map((conversation) => (
                    <DropdownMenuItem
                      key={conversation.sessionId}
                      className="flex items-center gap-2 p-3 cursor-pointer relative pr-10"
                      onSelect={(e) => e.preventDefault()}
                      disabled={loadingHistory}
                    >
                      <div
                        className="flex-1 flex flex-col items-start gap-1 min-w-0"
                        onClick={() => !loadingHistory && loadConversation(conversation.sessionId)}
                      >
                        <div className="font-medium text-sm truncate w-full max-w-[180px]">
                          {conversation.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(conversation.lastUpdated).toLocaleDateString()} • {conversation.messageCount} messages</span>
                          {conversation.attachedJdTitle && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                              JD: {conversation.attachedJdTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.sessionId);
                        }}
                      >
                        <X className="h-4 w-4" />
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
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="relative z-10 flex flex-col h-[calc(100vh-100px)] overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-20 md:pb-16">
            <div className="w-full 2xl:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 space-y-6 overflow-hidden">
              {/* JD Attachment Indicator */}
              {currentSessionJdTitle && messages.length > 0 && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
                    <Bookmark className="h-4 w-4" />
                    <span>Searching with JD: <strong>{currentSessionJdTitle}</strong></span>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up overflow-hidden`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[calc(100%-2rem)] sm:max-w-[calc(85%-2rem)] lg:max-w-[70%] rounded-2xl px-3 sm:px-4 py-3 overflow-hidden ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground userchatcontent'
                        : 'bg-muted/60 border border-border/30 backdrop-blur-sm'
                      }`}
                  >
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${message.role === 'user' ? 'text-primary-foreground userchatcontent' : 'text-foreground'}`}>
                      {message.role === 'assistant' ? renderMessageContent(message.content, message.candidates) : message.content}
                    </div>
                    {message.candidates && (
                      <div className="mt-4 space-y-4 overflow-hidden">
                        <h4 className="font-semibold text-primary mb-3">Top Recommendations</h4>
                        {rankCandidates(message.candidates, message.content).slice(0, 3).map((candidate) => (
                          <div
                            key={candidate.id}
                            className="border rounded-lg p-3 sm:p-4 bg-card/50 hover:bg-card transition-colors cursor-pointer overflow-hidden"
                            onClick={() => openCandidateDetail(candidate)}
                          >
                            <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                              {/* Profile picture removed - LinkedIn API returns empty strings */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 min-w-0">
                                  <a
                                    href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-sm sm:text-base text-primary hover:text-primary/80 hover:underline truncate"
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
                                      width={16}
                                      height={16}
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                    />
                                  </a>
                                </div>
                                <div className="flex items-start gap-2 mb-1 min-w-0">
                                  {candidate.companyLogo && (
                                    <Image
                                      src={candidate.companyLogo}
                                      alt={candidate.company}
                                      width={16}
                                      height={16}
                                      className="w-3 h-3 sm:w-4 sm:h-4 object-contain flex-shrink-0 mt-0.5"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <p className="text-xs sm:text-sm text-foreground font-medium break-words">{candidate.title}</p>
                                </div>
                                <div className="flex items-start gap-2 mb-1 min-w-0">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{candidate.location}</p>
                                </div>
                                {candidate.education && (
                                  <div className="flex items-start gap-2 mb-2 min-w-0">
                                    <School className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">{candidate.education}</p>
                                  </div>
                                )}
                                <div className="mt-2 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <Sparkles className="min-h-3 min-w-3 sm:min-h-4 sm:min-w-4 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-8 break-words">{candidate.summary}</p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={savedProfiles.has(candidate.public_id) ? "default" : "outline"}
                                className={`flex-shrink-0 text-xs sm:text-sm ${savedProfiles.has(candidate.public_id) ? 'text-white' : 'text-primary border-primary hover:bg-primary/5'}`}
                                onClick={(e) => handleToggleSave(candidate.public_id, e)}
                              >
                                <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${savedProfiles.has(candidate.public_id) ? 'fill-white' : ''}`} />
                                <span className="hidden sm:inline">{savedProfiles.has(candidate.public_id) ? "Saved" : "Save"}</span>
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* All Profiles Section with Pagination */}
                        <div className="mt-8 overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 overflow-hidden">
                            <h4 className="text-base sm:text-lg font-medium text-foreground break-words">All Profiles ({message.candidates?.length || 0})</h4>
                            <div className="flex items-center gap-2">
                              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                {message.candidates && (
                                  <>
                                    {Math.min((currentPage - 1) * profilesPerPage + 1, message.candidates.length)} - {Math.min(currentPage * profilesPerPage, message.candidates.length)} of {message.candidates.length}
                                  </>
                                )}
                              </div>
                              {/* <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFilterDialogOpen(true)}
                                className="text-primary border-primary hover:bg-primary/5"
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                Edit Filters
                              </Button> */}
                            </div>
                          </div>

                          {/* Pagination Controls */}
                          {message.candidates && message.candidates.length > profilesPerPage && (
                            <div className="flex items-center justify-center mb-4">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                  className="px-2 sm:px-3"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1">Previous</span>
                                </Button>

                                <div className="flex items-center space-x-1">
                                  {paginationPages.map((pageNumber) => (
                                    <Button
                                      key={`page-${pageNumber}`}
                                      variant={currentPage === pageNumber ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNumber)}
                                      className="min-w-8 w-8 h-8 p-0"
                                    >
                                      {pageNumber}
                                    </Button>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => message.candidates ? Math.min(Math.ceil(message.candidates.length / profilesPerPage), prev + 1) : prev)}
                                  disabled={currentPage === (message.candidates ? Math.ceil(message.candidates.length / profilesPerPage) : 1)}
                                  className="px-2 sm:px-3"
                                >
                                  <span className="hidden sm:inline mr-1">Next</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 min-w-0">
                            {(() => {
                              if (!message.candidates) return null;

                              const startIndex = (currentPage - 1) * profilesPerPage;
                              const endIndex = startIndex + profilesPerPage;
                              const paginatedCandidates = message.candidates.slice(startIndex, endIndex);

                              return paginatedCandidates.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors cursor-pointer overflow-hidden min-w-0"
                                  onClick={(e) => {
                                    // Don't trigger if clicking the save button
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    openCandidateDetail(candidate);
                                  }}
                                >
                                  {/* Company Logo */}
                                  <div className="flex-shrink-0 mt-1">
                                    {candidate.companyLogo ? (
                                      <Image
                                        src={candidate.companyLogo}
                                        alt={candidate.company}
                                        width={24}
                                        height={24}
                                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-muted-foreground font-medium">
                                          {candidate.company?.charAt(0) || '?'}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 min-w-0">
                                      <a
                                        href={candidate.linkedinUrl || `https://www.linkedin.com/in/${candidate.public_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-sm sm:text-base text-primary hover:text-primary/80 hover:underline truncate"
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
                                          className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                                        />
                                      </a>
                                    </div>
                                    <p className="text-xs sm:text-sm text-foreground font-medium line-clamp-2 mb-1 break-words">{candidate.title}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate mb-2">{candidate.company}</p>
                                    {candidate.summary && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                                        {candidate.summary.length > 100
                                          ? `${candidate.summary.substring(0, 100)}...`
                                          : candidate.summary}
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    variant={savedProfiles.has(candidate.public_id) ? "default" : "outline"}
                                    className={`flex-shrink-0 text-xs sm:text-sm ${savedProfiles.has(candidate.public_id) ? 'text-white' : 'text-primary border-primary hover:bg-primary/5'}`}
                                    onClick={(e) => handleToggleSave(candidate.public_id, e)}
                                  >
                                    <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${savedProfiles.has(candidate.public_id) ? 'fill-white' : ''}`} />
                                    <span className="hidden sm:inline ml-1">{savedProfiles.has(candidate.public_id) ? "Saved" : "Save"}</span>
                                  </Button>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${message.role === 'user'
                        ? 'opacity-60 text-primary-foreground/60'
                        : 'text-muted-foreground'
                      }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
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
          <div className="fixed bottom-12 md:bottom-0 left-0 md:left-64 right-0 bg-background/80 backdrop-blur-sm border-t">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                    className="h-12 text-base pl-4 pr-12 border-2 border-border focus:border-primary rounded-lg"
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
                  className="h-12 w-12 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
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

        {/* Candidate Detail Modal */}
        <CandidateDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          candidate={selectedCandidate}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] bg-background animate-fade-in flex flex-col relative overflow-hidden">
      {/* Subtle Animated Grid Background */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${showChat ? 'opacity-5' : 'opacity-75'}`}>
        <div className="absolute inset-0 bg-grid-pattern animate-grid-flow"></div>
        {/* Radial fade overlay to reduce opacity at center */}
        <div className="absolute inset-0 bg-radial-fade"></div>
      </div>
      {/* Fixed Header with Controls */}
      <div className="fixed top-20 right-2 md:right-4 z-30 flex items-center gap-2">
        {/* History dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
            {conversationHistory.length > 0 ? (
              <>
                {conversationHistory.map((conversation) => (
                  <DropdownMenuItem
                    key={conversation.sessionId}
                    className="flex items-center gap-2 p-3 cursor-pointer relative pr-10"
                    onSelect={(e) => e.preventDefault()}
                    disabled={loadingHistory}
                  >
                    <div
                      className="flex-1 flex flex-col items-start gap-1 min-w-0"
                      onClick={() => !loadingHistory && loadConversation(conversation.sessionId)}
                    >
                      <div className="font-medium text-sm truncate w-full max-w-[180px]">
                        {conversation.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(conversation.lastUpdated).toLocaleDateString()} • {conversation.messageCount} messages</span>
                        {conversation.attachedJdTitle && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                            JD: {conversation.attachedJdTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.sessionId);
                      }}
                    >
                      <X className="h-4 w-4" />
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

        {/* Reset button - disabled on main screen */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetConversation}
          disabled={!showChat}
          className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Main Content - accounting for sidebar */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-8 animate-fade-in-up grow">
        {/* Header Section */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-16 flex items-center justify-center">
              <Image
                src="https://i0.wp.com/www.lyzr.ai/wp-content/uploads/2024/11/cropped_lyzr_logo_1.webp?fit=452%2C180&ssl=1"
                alt="Lyzr Logo"
                width={80}
                height={48}
                className="h-10 sm:h-12 w-auto object-contain dark:invert"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Lyzr HR Candidate Sourcing Agent
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Find exactly who you&apos;re looking for, in seconds.
            <a href={DEFAULT_DEMO_URL} target="_blank" rel="noopener noreferrer" className="text-primary cursor-pointer hover:underline ml-1">
              See how it works.
            </a>
          </p>
        </div>

        {/* Clean Search Interface */}
        <div className="w-full max-w-3xl space-y-4 animate-fade-in-up px-2">

          {/* Main Search Input */}
          <div className="relative">
            <div className="relative">
              {selectedJD && (
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                    style={{
                      maxWidth: `${Math.min(selectedJD.name.length * 6.5 + 40, 200)}px`
                    }}
                    title={selectedJD.name}
                  >
                    <span className="truncate">@{selectedJD.name}</span>
                    <Button
                      onClick={() => setSelectedJD(null)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
              )}
              <Textarea
                placeholder={searchQuery.trim() ? "" : (isClient ? placeholderText : "Search for candidates...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      handleSearch();
                    }
                  }
                }}
                className={`min-h-14 max-h-32 text-sm sm:text-base pr-20 sm:pr-24 border-2 border-border focus:border-primary rounded-lg shadow-sm resize-none bg-background/80 backdrop-blur-2xl`}
                style={{
                  paddingLeft: selectedJD ? `${getJdTagPadding(selectedJD.name)}px` : '12px'
                }}
                rows={1}
              />
            </div>
            <div className="absolute right-2 top-2">
              <Button
                className="h-10 px-4 sm:px-6 text-sm"
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
                className="flex items-center space-x-2 text-sm"
              >
                <span className="truncate max-w-[150px] sm:max-w-none">{selectedJD?.name || "Select JD"}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
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
                              setSelectedJD({ id: jd.id, name: jd.name });
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

          {/* Typing Hints - invisible positioning to prevent layout shift */}
          <div className={`mt-4 transition-all duration-300 ${!selectedJD && searchQuery.trim() ? 'opacity-100 h-auto' : 'opacity-0 overflow-hidden'}`}>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                For best results include
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">
                  <Target className="h-3 w-3" />
                  Job title or role
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">
                  <MapPinIcon className="h-3 w-3" />
                  Location
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">
                  <Clock className="h-3 w-3" />
                  Experience level
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">
                  <CheckCircle className="h-3 w-3" />
                  Specific skills
                </div>
              </div>
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

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        candidate={selectedCandidate}
      />
    </div>
  );
}
