"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconSparkles, IconMapPin, IconBuilding, IconBookmark, IconUpload, IconUsersGroup, IconLoader2, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthProvider";
import { toast } from "sonner";

interface Candidate {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  companyLogo?: string;
  selected?: boolean;
  public_id: string;
  years_of_experience?: number;
  education?: Array<{
    degree: string;
    field: string;
    school: string;
  }>;
}

interface JobDescription {
  _id?: string;
  id?: string;
  title: string;
  content: string;
}

interface RankedCandidate {
  rank: number;
  candidate_id: string;
  match_score: number;
  summary: string;
  key_strengths?: string[];
  potential_concerns?: string[];
  candidate_data?: Candidate;
}

export default function CandidateMatching() {
  const { isAuthenticated, userId } = useAuth();
  const [selectedJD, setSelectedJD] = useState("");
  const [availableJDs, setAvailableJDs] = useState<JobDescription[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [candidateDatabase, setCandidateDatabase] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);


  // Load JDs from API
  useEffect(() => {
    const loadJDs = async () => {
      if (!isAuthenticated || !userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/jds', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAvailableJDs(data || []);
        } else {
          console.error('Failed to load JDs');
        }
      } catch (error) {
        console.error('Error loading JDs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJDs();
  }, [isAuthenticated, userId]);

  // Load saved profiles from API
  useEffect(() => {
    const loadSavedProfiles = async () => {
      if (!isAuthenticated || !userId) return;
      
      try {
        const response = await fetch(`/api/saved-profiles/by-session?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform saved profiles to candidate format based on actual API structure
          const candidates = data.sessions.flatMap((session: any) => 
            session.savedProfiles.map((profile: any) => ({
              id: profile.candidate._id,
              public_id: profile.candidate.publicId,
              name: profile.candidate.fullName || 'Unknown',
              title: profile.candidate.jobTitle || 'No title',
              company: profile.candidate.company || 'No company',
              location: profile.candidate.location || 'Location not specified',
              summary: profile.candidate.summary || 'No summary available',
              companyLogo: '', // Not available in current API structure
              years_of_experience: 0, // Not available in current API structure
              education: [], // Not available in current API structure
              selected: false
            }))
          );
          setCandidateDatabase(candidates);
          setFilteredCandidates(candidates);
        } else {
          console.error('Failed to load saved profiles');
        }
      } catch (error) {
        console.error('Error loading saved profiles:', error);
      }
    };

    loadSavedProfiles();
  }, [isAuthenticated, userId]);

  // Fuzzy search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCandidates(candidateDatabase);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = candidateDatabase.filter(candidate => {
      const searchableText = [
        candidate.name,
        candidate.title,
        candidate.company,
        candidate.location,
        candidate.summary
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });
    
    setFilteredCandidates(filtered);
  }, [searchQuery, candidateDatabase]);

  const handleCandidateSelection = (candidateId: string) => {
    setCandidateDatabase(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, selected: !candidate.selected }
          : candidate
      )
    );
    setFilteredCandidates(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, selected: !candidate.selected }
          : candidate
      )
    );
  };

  const handleMatchCandidates = async () => {
    const selectedCandidates = candidateDatabase.filter(c => c.selected);
    const selectedJDData = availableJDs.find(jd => (jd._id || jd.id) === selectedJD);
    
    if (!selectedJDData || selectedCandidates.length === 0) {
      toast.error('Please select a job description and at least one candidate');
      return;
    }

    // Limit to 20 candidates
    const limitedCandidates = selectedCandidates.slice(0, 20);
    if (selectedCandidates.length > 20) {
      toast.warning(`Limited to first 20 candidates (${selectedCandidates.length} selected)`);
    }

    try {
      setIsMatching(true);
      setShowResults(false); // Hide previous results
      
      // Call the matching agent API
      const response = await fetch('/api/candidate-matching/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          jobDescription: {
            id: selectedJDData._id || selectedJDData.id,
            title: selectedJDData.title,
            content: selectedJDData.content
          },
          candidates: limitedCandidates,
          user: {
            id: userId,
            email: 'user@example.com', // This will be replaced with actual user data
            name: 'User'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRankedCandidates(data.rankedCandidates || []);
        setShowResults(true);
        toast.success(`Successfully ranked ${data.rankedCandidates?.length || 0} candidates`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to match candidates');
      }
    } catch (error) {
      console.error('Error matching candidates:', error);
      toast.error('Failed to match candidates. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  const selectedCandidatesCount = candidateDatabase.filter(c => c.selected).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Section Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Candidate Matching</h1>
        <p className="text-sm text-gray-600 mt-1">Match candidates with job descriptions using AI-powered ranking</p>
      </div>
      
      <div className="flex-1 flex">
        {/* Left Section */}
      <div className="w-1/2 p-6 border-r border-gray-200">
        <div className="h-full flex flex-col space-y-6">
          
          {/* Select JD Dropdown */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Job Description</h2>
            <Select value={selectedJD} onValueChange={(value) => {
              setSelectedJD(value);
            }}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select a JD from library" />
              </SelectTrigger>
              <SelectContent>
                {availableJDs.length > 0 ? (
                  availableJDs.map((jd, index) => (
                    <SelectItem 
                      key={jd._id || jd.id || `jd-${index}`} 
                      value={jd._id || jd.id || `jd-${index}`}
                    >
                      {jd.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-jd" disabled>
                    No JDs available. Create one in JD Library first.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Candidate Database */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Candidate Database</h2>
              <div className="flex space-x-2">
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Import Profiles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Import Candidate Profiles</DialogTitle>
                      <DialogDescription>
                        Choose how you&apos;d like to import candidate profiles into your database.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button variant="outline" className="justify-start h-12">
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with Workday
                      </Button>
                      <Button variant="outline" className="justify-start h-12">
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with SAP SuccessFactors
                      </Button>
                      <Button variant="outline" className="justify-start h-12">
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with Keka
                      </Button>
                      <Button variant="outline" className="justify-start h-12">
                        <IconUpload className="w-4 h-4 mr-3" />
                        Bulk Upload Resumes
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => setImportDialogOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search candidates by name, company, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-3">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <IconSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        {searchQuery ? 'No candidates found matching your search' : 'No candidates available'}
                      </p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                      <Checkbox 
                        checked={candidate.selected}
                        onCheckedChange={() => handleCandidateSelection(candidate.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
                        <p className="text-xs text-gray-600 truncate">{candidate.title}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {candidate.companyLogo ? (
                            <Image 
                              src={candidate.companyLogo} 
                              alt={candidate.company} 
                              width={12}
                              height={12}
                              className="w-3 h-3 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <IconBuilding className={`w-3 h-3 text-gray-400 ${candidate.companyLogo ? 'hidden' : ''}`} />
                          <span className="text-xs text-gray-500">{candidate.company}</span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              {selectedCandidatesCount} of {filteredCandidates.length} candidates selected
              {searchQuery && (
                <span className="text-gray-400 ml-2">
                  (showing {filteredCandidates.length} of {candidateDatabase.length} total)
                </span>
              )}
            </div>
          </div>

          {/* Match Candidates Button */}
          <div>
            <Button 
              onClick={handleMatchCandidates}
              disabled={!selectedJD || selectedCandidatesCount === 0 || isMatching}
              className="w-full h-12 bg-gradient-to-r from-[#603BFC] to-[#A94FA1] hover:from-[#5235E8] hover:to-[#9A45A0] text-white"
            >
              {isMatching ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  Matching Candidates...
                </>
              ) : (
                <>
                  <IconUsersGroup className="w-4 h-4 mr-2" />
                  Match {selectedCandidatesCount} Candidates
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 p-6">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {showResults ? "Ranked Candidates" : "Candidate Ranking"}
            </h2>
            {showResults && (
              <Badge variant="outline">{rankedCandidates.length} matches</Badge>
            )}
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-y-auto">
            {isMatching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <IconLoader2 className="w-12 h-12 mx-auto mb-4 text-[#603BFC] animate-spin" />
                  <p className="text-lg font-medium mb-2">Matching Candidates</p>
                  <p className="text-sm">
                    AI is analyzing and ranking your candidates...
                  </p>
                </div>
              </div>
            ) : showResults ? (
              <div className="p-4 space-y-4">
                {rankedCandidates.map((rankedCandidate) => {
                  const candidate = rankedCandidate.candidate_data;
                  if (!candidate) return null;
                  
                  return (
                    <div key={rankedCandidate.candidate_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              #{rankedCandidate.rank}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {rankedCandidate.match_score}% match
                            </Badge>
                            <h3 className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                              {candidate.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{candidate.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              {candidate.companyLogo ? (
                                <Image 
                                  src={candidate.companyLogo} 
                                  alt={candidate.company} 
                                  width={16}
                                  height={16}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <IconBuilding className={`w-4 h-4 fallback-icon ${candidate.companyLogo ? 'hidden' : ''}`} />
                              <span>{candidate.company}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <IconMapPin className="w-4 h-4" />
                              <span>{candidate.location}</span>
                            </div>
                            {candidate.years_of_experience && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {candidate.years_of_experience} years exp
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* AI Analysis */}
                          <div className="mt-3">
                            <div className="flex items-start space-x-2">
                              <div className="flex items-center mt-0.5">
                                <IconSparkles className="h-4 w-4 text-[#603BFC]" />
                              </div>
                              <div className="relative flex-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent rounded-sm opacity-60"></div>
                                <p className="text-sm text-gray-700 italic relative z-10 px-2 py-1">
                                  {rankedCandidate.summary}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Key Strengths */}
                          {rankedCandidate.key_strengths && rankedCandidate.key_strengths.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Key Strengths:</h4>
                              <div className="flex flex-wrap gap-1">
                                {rankedCandidate.key_strengths.map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Potential Concerns */}
                          {rankedCandidate.potential_concerns && rankedCandidate.potential_concerns.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Areas to Consider:</h4>
                              <div className="flex flex-wrap gap-1">
                                {rankedCandidate.potential_concerns.map((concern, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                    {concern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="text-[#603BFC] border-[#603BFC] hover:bg-purple-50">
                            <IconBookmark className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <IconUsersGroup className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Ready to Match Candidates</p>
                  <p className="text-sm">
                    Select a JD and choose candidates to see ranked matches
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}