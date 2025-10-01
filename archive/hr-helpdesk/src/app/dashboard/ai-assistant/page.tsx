"use client";

import { useState, useContext, useEffect, useCallback } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatEmptyState } from "@/components/chat-empty-state";
import { StarterQuestionsList } from "@/components/starter-questions";
import { GradientManager } from "@/components/gradient-manager";
import { useAuth } from "@/lib/AuthProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User, Bot, History, RefreshCw, Plus } from "lucide-react";
import { marked } from "marked";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface UserData {
  _id: string;
  currentOrganization: string;
  name: string;
  email: string;
}

interface ConversationHistory {
  sessionId: string;
  title: string;
  messages: Message[];
  lastUpdated: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const { userId, isAuthenticated } = useAuth();

  // Load conversation history and current session from localStorage
  useEffect(() => {
    if (userData?.currentOrganization) {
      loadConversationHistory();
      loadCurrentSession();
    }
  }, [userData?.currentOrganization]);

  const loadConversationHistory = useCallback(() => {
    if (!userData?.currentOrganization) return;
    
    const historyKey = `chat_history_${userData.currentOrganization}`;
    const storedHistory = localStorage.getItem(historyKey);
    
    console.log(`Loading conversation history for org: ${userData.currentOrganization}, key: ${historyKey}`);
    
    if (storedHistory) {
      try {
        const history: ConversationHistory[] = JSON.parse(storedHistory);
        setConversationHistory(history);
        console.log(`Loaded ${history.length} conversations for org ${userData.currentOrganization}:`, history.map(h => h.title));
      } catch (error) {
        console.error('Error loading conversation history:', error);
        setConversationHistory([]);
      }
    } else {
      console.log(`No conversation history found for org ${userData.currentOrganization}`);
      setConversationHistory([]);
    }
  }, [userData?.currentOrganization]);

  const loadCurrentSession = useCallback(() => {
    if (!userData?.currentOrganization) return;
    
    const storageKey = `chat_session_${userData.currentOrganization}`;
    const storedSession = localStorage.getItem(storageKey);
    
    if (storedSession) {
      try {
        const { sessionId: storedSessionId, messages: storedMessages } = JSON.parse(storedSession);
        setSessionId(storedSessionId);
        setMessages(storedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        console.log(`Loaded current session for org ${userData.currentOrganization}:`, storedSessionId);
      } catch (error) {
        console.error('Error loading stored conversation:', error);
        setMessages([]);
        setSessionId(null);
      }
    } else {
      setMessages([]);
      setSessionId(null);
    }
  }, [userData?.currentOrganization]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (userData?.currentOrganization && messages.length > 0) {
      saveCurrentSession();
      saveToHistory();
    }
  }, [messages, sessionId, userData?.currentOrganization]);

  const saveCurrentSession = useCallback(() => {
    if (!userData?.currentOrganization || messages.length === 0) return;
    
    const storageKey = `chat_session_${userData.currentOrganization}`;
    const sessionData = {
      sessionId,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString()
      })),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(sessionData));
    console.log(`Saved current session for org ${userData.currentOrganization}:`, sessionId);
  }, [userData?.currentOrganization, messages, sessionId]);

  const saveToHistory = useCallback(() => {
    if (!userData?.currentOrganization || !sessionId || messages.length === 0) return;
    
    const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');
    const historyKey = `chat_history_${userData.currentOrganization}`;
    
    // Load the current organization's history from localStorage to ensure we're working with the right data
    const storedHistory = localStorage.getItem(historyKey);
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    
    const existingIndex = currentHistory.findIndex((conv: ConversationHistory) => conv.sessionId === sessionId);
    
    const conversationData: ConversationHistory = {
      sessionId,
      title,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
      })),
      lastUpdated: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      currentHistory[existingIndex] = conversationData;
    } else {
      currentHistory.unshift(conversationData);
    }
    
    // Store all conversations (no limit)
    setConversationHistory(currentHistory);
    localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    console.log(`Saved conversation to history for org ${userData.currentOrganization}:`, sessionId);
  }, [userData?.currentOrganization, sessionId, messages]);

  // Fetch user data and get current organization from URL
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isAuthenticated) return;

      try {
        // Get current organization from URL parameter (like header and sidebar do)
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get('org');

        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          let currentOrgId = '';
          let userName = data.user?.name || (data.user?.email ? data.user?.email.split('@')[0] : 'User');
          let userEmail = data.user?.email || '';

          // Use organization from URL parameter if available
          if (orgId && data.organizations) {
            const org = data.organizations.find((o: any) => o._id === orgId);
            if (org) {
              currentOrgId = orgId;
              console.log('Using current organization from URL:', org.name);
            } else {
              console.warn('Organization from URL not found in user organizations');
            }
          }
          
          // Fallback to first organization if no URL org or org not found
          if (!currentOrgId && data.organizations?.length > 0) {
            currentOrgId = data.organizations[0]._id;
            console.log('Falling back to first organization:', data.organizations[0].name);
          }

          if (!currentOrgId) {
            console.error('No organizations found for user');
            return;
          }

          setUserData({
            _id: userId,
            currentOrganization: currentOrgId,
            name: userName,
            email: userEmail,
          });
          
          console.log('AI Assistant initialized with organization:', currentOrgId);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated]);

  // Clear conversation function
  const clearConversation = useCallback(() => {
    if (userData?.currentOrganization) {
      const storageKey = `chat_session_${userData.currentOrganization}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
      setSessionId(null);
      console.log('Conversation cleared for organization:', userData.currentOrganization);
    }
  }, [userData?.currentOrganization]);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    if (userData?.currentOrganization) {
      // Save current conversation to history if it has messages
      if (messages.length > 0 && sessionId) {
        saveToHistory();
      }
      
      // Clear current session
      const storageKey = `chat_session_${userData.currentOrganization}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
      setSessionId(null);
      console.log('New conversation created for organization:', userData.currentOrganization);
    }
  }, [userData?.currentOrganization, messages, sessionId]);

  // Load conversation from history
  const loadConversation = useCallback((conversation: ConversationHistory) => {
    if (userData?.currentOrganization) {
      // Save current conversation to history first if it has messages
      if (messages.length > 0 && sessionId && sessionId !== conversation.sessionId) {
        saveToHistory();
      }
      
      setSessionId(conversation.sessionId);
      setMessages(conversation.messages);
      
      // Update current session storage
      const storageKey = `chat_session_${userData.currentOrganization}`;
      const sessionData = {
        sessionId: conversation.sessionId,
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toString()
        })),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
      console.log('Loaded conversation:', conversation.title);
    }
  }, [userData?.currentOrganization, messages, sessionId]);

  // Listen for organization changes in URL (when user switches in header)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newOrgId = urlParams.get('org');
      
      if (newOrgId && userData && newOrgId !== userData.currentOrganization) {
        console.log('Organization changed via URL, updating AI assistant:', newOrgId);
        
        // Save current conversation before switching
        if (messages.length > 0 && sessionId) {
          saveToHistory();
        }
        
        // Clear current conversation and history when switching organizations
        setMessages([]);
        setSessionId(null);
        setConversationHistory([]); // Clear history state first
        
        // Update userData with new organization
        setUserData({
          ...userData,
          currentOrganization: newOrgId
        });
        
        // Load conversation history for the new organization
        loadConversationHistory();
        loadCurrentSession();
      }
    };

    // Listen for URL changes (when user switches org in header)
    window.addEventListener('popstate', handleUrlChange);
    
    // Also listen for custom organization change events
    window.addEventListener('organizationChanged', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('organizationChanged', handleUrlChange);
    };
  }, [userData, messages, sessionId, loadConversationHistory, loadCurrentSession, saveToHistory]);

  // Additional effect to detect URL changes via router navigation
  useEffect(() => {
    const checkUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newOrgId = urlParams.get('org');
      
      if (newOrgId && userData && newOrgId !== userData.currentOrganization) {
        console.log('Organization changed via router navigation, updating AI assistant:', newOrgId);
        
        // Save current conversation before switching
        if (messages.length > 0 && sessionId) {
          saveToHistory();
        }
        
        // Clear current conversation and history when switching organizations
        setMessages([]);
        setSessionId(null);
        setConversationHistory([]); // Clear history state first
        
        // Update userData with new organization
        setUserData({
          ...userData,
          currentOrganization: newOrgId
        });
        
        // Load conversation history for the new organization
        loadConversationHistory();
        loadCurrentSession();
      }
    };

    // Check for URL changes periodically (as a fallback)
    const interval = setInterval(checkUrlChange, 1000);
    
    return () => clearInterval(interval);
  }, [userData, messages, sessionId, loadConversationHistory, loadCurrentSession, saveToHistory]);

  // Don't render until we have user data
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI assistant...</p>
        </div>
      </div>
    );
  }

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    if (!userData?.currentOrganization) {
      console.error('No current organization selected');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const requestBody = {
        message: content,
        organizationId: userData.currentOrganization,
        userId: userData._id,
        sessionId: sessionId,
      };
      
      console.log('Sending chat request:', requestBody);

      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update session ID for conversation continuity
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "I'm sorry, I'm having trouble connecting to the AI assistant right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Configure marked for safe HTML rendering
  const renderMarkdown = (content: string) => {
    const html = marked(content, {
      breaks: true,
      gfm: true,
    });
    return { __html: html as string };
  };

  return (
    <>
      <GradientManager hasMessages={messages.length > 0} />
      <div className="flex flex-col h-full relative items-center justify-center">
        {/* Fixed conversation controls at top */}
        <div className="fixed top-20 right-4 z-30 flex items-center gap-2">
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
                      onClick={() => loadConversation(conversation)}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    >
                      <div className="font-medium text-sm truncate w-full">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conversation.lastUpdated).toLocaleDateString()}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={createNewConversation}
                    className="gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
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
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={createNewConversation}
            className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            New
          </Button>
        </div>
        {messages.length === 0 ? (
          <ChatEmptyState>
            <ChatInput 
              onSend={handleSend} 
              isLoading={isLoading}
              placeholder="Ask a question about HR policies, benefits, or procedures..."
            />
            <StarterQuestionsList handleSend={handleSend} />
          </ChatEmptyState>
        ) : (
          <div className="w-full relative pt-10">
            {/* Messages Area */}
            <div className="w-full">
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
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
                      {message.role === 'assistant' ? (
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert 
                                     prose-headings:font-bold prose-headings:text-foreground 
                                     prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
                                     prose-headings:mt-4 prose-headings:mb-2
                                     prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed
                                     prose-strong:text-foreground prose-strong:font-semibold
                                     prose-code:text-foreground prose-code:bg-background/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                                     prose-pre:bg-background/80 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-3
                                     prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                                     prose-blockquote:border-l-primary prose-blockquote:bg-background/50 prose-blockquote:my-3
                                     [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          dangerouslySetInnerHTML={renderMarkdown(message.content)}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap userchatcontent">
                          {message.content}
                        </p>
                      )}
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' 
                          ? 'opacity-60' 
                          : 'text-muted-foreground'
                      }`}>
                        {message.timestamp instanceof Date 
                          ? message.timestamp.toLocaleTimeString()
                          : new Date(message.timestamp).toLocaleTimeString()
                        }
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
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/60 border border-border/30 backdrop-blur-sm rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Input Area at Bottom */}
            <div className="fixed bottom-0 z-20 flex justify-center lg:left-64 left-16 right-0 bg-gradient-to-b from-transparent to-background backdrop-blur-sm">
              <div className="w-full max-w-4xl px-4">
                <ChatInput 
                  onSend={handleSend} 
                  isLoading={isLoading}
                  placeholder="Ask a follow-up question..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}