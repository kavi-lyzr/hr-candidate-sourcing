"use client";

import { useState } from "react";
import Image from "next/image";
import { IconChevronDown, IconChevronRight, IconCalendar, IconBuilding } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SavedProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  savedDate: string;
}

interface SearchHistory {
  id: string;
  query: string;
  date: string;
  resultsCount: number;
  savedProfiles: SavedProfile[];
}

export default function SavedProfiles() {
  const [expandedSearch, setExpandedSearch] = useState<string | null>(null);

  // Mock data for search history and saved profiles
  const searchHistory: SearchHistory[] = [
    {
      id: "1",
      query: "Software engineers in the Bay Area with 2+ years of experience building AI Agents on Lyzr",
      date: "December 20, 2024",
      resultsCount: 449,
      savedProfiles: [
        {
          id: "p1",
          name: "Jo Rhett",
          title: "Staff Engineer, Cloud Security And Infrastructure",
          company: "Tulip",
          location: "San Jose, California",
          summary: "Experienced cloud security engineer with 8+ years at leading tech companies, specializing in infrastructure automation and security protocols.",
          savedDate: "December 20, 2024"
        },
        {
          id: "p2", 
          name: "Erwin Jansen",
          title: "Software Engineer",
          company: "Google",
          location: "San Francisco, California",
          summary: "AI/ML software engineer with PhD in Computer Science, currently building next-generation search algorithms at Google.",
          savedDate: "December 20, 2024"
        }
      ]
    },
    {
      id: "2",
      query: "Data scientists in New York with 3+ years of experience in machine learning and Python",
      date: "December 18, 2024",
      resultsCount: 267,
      savedProfiles: [
        {
          id: "p3",
          name: "Sarah Chen",
          title: "Senior Data Scientist",
          company: "Spotify",
          location: "New York, New York",
          summary: "ML engineer specializing in recommendation systems and natural language processing, with expertise in Python and TensorFlow.",
          savedDate: "December 18, 2024"
        }
      ]
    },
    {
      id: "3",
      query: "Product managers in Seattle with 4+ years of experience in SaaS companies",
      date: "December 15, 2024",
      resultsCount: 156,
      savedProfiles: []
    }
  ];

  const toggleSearchExpansion = (searchId: string) => {
    setExpandedSearch(expandedSearch === searchId ? null : searchId);
  };

  // totalSavedProfiles calculation removed as it was unused

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
            <Card key={search.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSearchExpansion(search.id)}
                        className="p-1 h-6 w-6"
                      >
                        {expandedSearch === search.id ? (
                          <IconChevronDown className="w-4 h-4" />
                        ) : (
                          <IconChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm leading-5">
                          {search.query}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">{search.date}</p>
                          <Badge variant="outline" className="text-xs">
                            {search.resultsCount} results
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                            {search.savedProfiles.length} saved
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedSearch === search.id && search.savedProfiles.length > 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Saved Profiles ({search.savedProfiles.length})</h4>
                    <div className="space-y-3">
                      {search.savedProfiles.map((profile) => (
                        <div key={profile.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                                  {profile.name}
                                </h5>
                                <a href="#" className="w-5 h-5 hover:opacity-80 transition-opacity">
                                  <Image 
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/1024px-LinkedIn_icon.svg.png" 
                                    alt="LinkedIn" 
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                </a>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <IconBuilding className="w-4 h-4 text-gray-400" />
                                  <p className="text-sm text-gray-900">{profile.title} at {profile.company}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <IconCalendar className="w-4 h-4 text-gray-400" />
                                  <p className="text-xs text-gray-500">Saved on {profile.savedDate}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 italic mt-2">{profile.summary}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}

              {expandedSearch === search.id && search.savedProfiles.length === 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 text-center py-4">
                      No profiles saved from this search yet
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