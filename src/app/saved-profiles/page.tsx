"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar, Building, Link as LinkIcon, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import { useAuth } from "@/lib/AuthProvider";
import { toast } from "sonner";

interface SavedProfile {
  _id: string;
  savedAt: string;
  candidate: {
    _id: string;
    publicId: string;
    fullName: string;
    jobTitle: string;
    company: string;
    location: string;
    summary: string;
  };
}

interface SearchSessionGroup {
  sessionId: string;
  query: string;
  date: string;
  savedProfiles: SavedProfile[];
  resultsCount?: number; // Optional as it's not in the current API response
}

export default function SavedProfiles() {
  const { isAuthenticated, userId } = useAuth();
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchSessionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [candidateDetailsCache, setCandidateDetailsCache] = useState<Map<string, any>>(new Map());

  // Function to fetch full candidate details from database
  const fetchCandidateDetails = async (publicId: string) => {
    if (candidateDetailsCache.has(publicId)) {
      return candidateDetailsCache.get(publicId);
    }

    try {
      const response = await fetch('/api/candidates/get-by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: [publicId] }),
      });

      if (response.ok) {
        const candidates = await response.json();
        if (Array.isArray(candidates) && candidates.length > 0) {
          const fullCandidate = candidates[0];
          setCandidateDetailsCache(prev => new Map(prev).set(publicId, fullCandidate));
          return fullCandidate;
        }
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
    return null;
  };

  // Function to open detail modal
  const openCandidateDetail = async (publicId: string) => {
    if (!publicId) {
      toast.error('Unable to load candidate details');
      return;
    }

    const fullDetails = await fetchCandidateDetails(publicId);
    
    if (fullDetails) {
      setSelectedCandidate(fullDetails);
      setDetailModalOpen(true);
    } else {
      toast.error('Unable to load candidate details');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchSavedProfiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/saved-profiles/by-session?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
            }
        });
        if (response.ok) {
          const data = await response.json();
          setSearchHistory(data.sessions || []);
          // Auto-expand the first session if it exists
          if (data.sessions && data.sessions.length > 0) {
            setExpandedSearch(data.sessions[0].sessionId);
          }
        } else {
          toast.error("Failed to load saved profiles.");
        }
      } catch (error) {
        console.error("Error fetching saved profiles:", error);
        toast.error("An error occurred while loading your profiles.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedProfiles();
  }, [isAuthenticated, userId]);

  const toggleSearchExpansion = (searchId: string) => {
    setExpandedSearch(expandedSearch === searchId ? null : searchId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Saved Profiles</h1>
            <p className="text-muted-foreground">Manage your saved candidate profiles and search history</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Search History & Saved Profiles</h2>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (searchHistory.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Saved Profiles</h1>
            <p className="text-muted-foreground">Manage your saved candidate profiles and search history</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Saved Profiles Found</h3>
            <p className="text-muted-foreground mb-4">Start a new search and save candidates to see them here.</p>
            <Button onClick={() => window.location.href = '/'}>
              <Search className="w-4 h-4 mr-2" />
              Start Searching
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Saved Profiles</h1>
          <p className="text-muted-foreground">Manage your saved candidate profiles and search history</p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {/* Search History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Search History & Saved Profiles</h2>
          
          {searchHistory.map((search) => (
            <Card key={search.sessionId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSearchExpansion(search.sessionId)}
                        className="p-1 h-6 w-6 hover:bg-accent transition-colors"
                      >
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedSearch === search.sessionId ? 'rotate-0' : '-rotate-90'
                          }`} 
                        />
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-sm leading-5">
                          {search.query}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-muted-foreground">{new Date(search.date).toLocaleDateString()}</p>
                          {search.resultsCount && (
                            <Badge variant="outline" className="text-xs">
                                {search.resultsCount} results
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                            {search.savedProfiles.length} saved
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedSearch === search.sessionId && search.savedProfiles.length > 0 && (
                <CardContent className="pt-0 animate-fade-in">
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Saved Profiles ({search.savedProfiles.length})</h4>
                    <div className="space-y-3">
                      {search.savedProfiles.map((profile, index) => (
                        <div 
                          key={profile._id} 
                          className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors duration-200 animate-fade-in-up cursor-pointer"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => openCandidateDetail(profile.candidate.publicId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 
                                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                  {profile.candidate.fullName}
                                </h5>
                                <a 
                                  href={`https://www.linkedin.com/in/${profile.candidate.publicId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="w-5 h-5 hover:opacity-80 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                </a>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Building className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm text-foreground">{profile.candidate.jobTitle} at {profile.candidate.company}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Saved on {new Date(profile.savedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground italic mt-2">{profile.candidate.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                              disabled // Remove functionality is not implemented in this pass
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}

              {expandedSearch === search.sessionId && search.savedProfiles.length === 0 && (
                <CardContent className="pt-0 animate-fade-in">
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No profiles saved from this search yet. This can happen if they were unsaved.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        candidate={selectedCandidate}
      />
    </div>
  );
}