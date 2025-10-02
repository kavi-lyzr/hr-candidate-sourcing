"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, Calendar, Building, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-xl font-semibold text-gray-900">Saved Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your saved candidate profiles and search history</p>
            </div>
            <div className="flex-1 p-6 text-center">
                <p>Loading your saved profiles...</p>
            </div>
        </div>
    )
  }

  if (searchHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Saved Profiles</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your saved candidate profiles and search history</p>
        </div>
        <div className="flex-1 p-6 text-center">
            <h3 className="text-lg font-medium">No Saved Profiles Found</h3>
            <p className="text-gray-500 mt-2">Start a new search and save candidates to see them here.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/'}>
                Start Searching
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Section Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Saved Profiles</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your saved candidate profiles and search history</p>
      </div>
      
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
        {/* Search History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Search History & Saved Profiles</h2>
          
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
                        className="p-1 h-6 w-6"
                      >
                        {expandedSearch === search.sessionId ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-5">
                          {search.query}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">{new Date(search.date).toLocaleDateString()}</p>
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
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Saved Profiles ({search.savedProfiles.length})</h4>
                    <div className="space-y-3">
                      {search.savedProfiles.map((profile) => (
                        <div key={profile._id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 className="font-medium text-primary hover:text-primary/80 cursor-pointer" onClick={() => window.open(`https://www.linkedin.com/in/${profile.candidate.publicId}`, '_blank')}>
                                  {profile.candidate.fullName}
                                </h5>
                                <a href={`https://www.linkedin.com/in/${profile.candidate.publicId}`} target="_blank" rel="noopener noreferrer" className="w-5 h-5 hover:opacity-80 transition-opacity">
                                  <LinkIcon className="w-4 h-4 text-gray-500" />
                                </a>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Building className="w-4 h-4 text-gray-400" />
                                  <p className="text-sm text-gray-900">{profile.candidate.jobTitle} at {profile.candidate.company}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <p className="text-xs text-gray-500">Saved on {new Date(profile.savedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 italic mt-2">{profile.candidate.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled // Remove functionality is not implemented in this pass
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
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 text-center py-4">
                      No profiles saved from this search yet. This can happen if they were unsaved.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}