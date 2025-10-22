"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconSparkles, IconMapPin, IconBuilding, IconBookmark, IconUpload, IconUsersGroup, IconLoader2, IconSearch, IconDotsVertical, IconExternalLink } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
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
  const openCandidateDetail = async (candidate: any) => {
    const publicId = candidate.public_id || candidate.id;
    
    if (!publicId) {
      toast.error('Unable to load candidate details');
      return;
    }

    const fullDetails = await fetchCandidateDetails(publicId);
    
    if (fullDetails) {
      setSelectedCandidate(fullDetails);
      setDetailModalOpen(true);
    } else {
      // Fallback to partial data
      setSelectedCandidate(candidate);
      setDetailModalOpen(true);
    }
  };

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
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Candidate Matching</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Match candidates with job descriptions using AI-powered ranking</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-230px)]">
        {/* Left Section */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-4 lg:space-y-6">
          {/* Select JD Dropdown */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3">Select Job Description</h2>
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
          <div className="flex-1 flex flex-col min-h-0 lg:max-h-none max-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
              <h2 className="text-base sm:text-lg font-semibold">Candidate Database</h2>
              <div className="flex space-x-2">
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
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
                      <Button variant="outline" className="justify-start h-12 opacity-50 cursor-not-allowed" disabled>
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with Workday
                        <Badge variant="secondary" className="ml-auto text-xs">Contact Us</Badge>
                      </Button>
                      <Button variant="outline" className="justify-start h-12 opacity-50 cursor-not-allowed" disabled>
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with SAP SuccessFactors
                        <Badge variant="secondary" className="ml-auto text-xs">Contact Us</Badge>
                      </Button>
                      <Button variant="outline" className="justify-start h-12 opacity-50 cursor-not-allowed" disabled>
                        <IconUsersGroup className="w-4 h-4 mr-3" />
                        Integrate with Keka
                        <Badge variant="secondary" className="ml-auto text-xs">Contact Us</Badge>
                      </Button>
                      <Button variant="outline" className="justify-start h-12 opacity-50 cursor-not-allowed" disabled>
                        <IconUpload className="w-4 h-4 mr-3" />
                        Bulk Upload Resumes
                        <Badge variant="secondary" className="ml-auto text-xs">Schedule Demo</Badge>
                      </Button>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">
                        Contact us for these additional features or schedule a demo
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => setImportDialogOpen(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search candidates by name, company, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="bg-card rounded-lg border flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-3">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconSearch className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">
                        {searchQuery ? 'No candidates found matching your search' : 'No candidates available'}
                      </p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        candidate.selected 
                          ? 'bg-primary/10 border-primary/20 hover:bg-primary/15' 
                          : 'hover:bg-muted/50 border-border'
                      }`}
                      onClick={(e) => {
                        // If clicking on the candidate name, open modal
                        if ((e.target as HTMLElement).closest('.candidate-name')) {
                          openCandidateDetail(candidate);
                        } else {
                          // Otherwise toggle selection
                          handleCandidateSelection(candidate.id);
                        }
                      }}
                    >
                      <Checkbox 
                        checked={candidate.selected}
                        className="mt-1 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground text-sm candidate-name hover:text-primary transition-colors">{candidate.name}</h4>
                          {candidate.public_id && (
                            <a 
                              href={`https://www.linkedin.com/in/${candidate.public_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
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
                          <IconBuilding className={`w-3 h-3 text-muted-foreground ${candidate.companyLogo ? 'hidden' : ''}`} />
                          <span className="text-xs text-muted-foreground">{candidate.company}</span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
              {selectedCandidatesCount} of {filteredCandidates.length} candidates selected
              {searchQuery && (
                <span className="text-muted-foreground/60 ml-2 hidden sm:inline">
                  (showing {filteredCandidates.length} of {candidateDatabase.length} total)
                </span>
              )}
            </div>
          </div>

          {/* Match Candidates Button */}
          <div className="mt-auto pt-4">
            <Button
              onClick={handleMatchCandidates}
              disabled={!selectedJD || selectedCandidatesCount === 0 || isMatching}
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
            >
              {isMatching ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Matching Candidates...</span>
                  <span className="sm:hidden">Matching...</span>
                </>
              ) : (
                <>
                  <IconUsersGroup className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Match {selectedCandidatesCount} Candidates</span>
                  <span className="sm:hidden">Match ({selectedCandidatesCount})</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full lg:w-1/2 flex flex-col mt-6 lg:mt-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold">
              {showResults ? "Ranked Candidates" : "Candidate Ranking"}
            </h2>
            {showResults && (
              <Badge variant="outline" className="text-xs sm:text-sm">{rankedCandidates.length} matches</Badge>
            )}
          </div>

          <div className="bg-card rounded-lg border flex-1 overflow-y-auto min-h-[400px] lg:min-h-0">
            {isMatching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <IconLoader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-lg font-medium mb-2">Matching Candidates</p>
                  <p className="text-sm">
                    AI is analyzing and ranking your candidates...
                  </p>
                </div>
              </div>
            ) : showResults ? (
              <div className="p-4 space-y-4">
                {rankedCandidates.map((rankedCandidate, index) => {
                  const candidate = rankedCandidate.candidate_data;
                  if (!candidate) return null;
                  
                  return (
                    <div
                      key={rankedCandidate.candidate_id}
                      className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => openCandidateDetail(candidate)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-xs">
                              #{rankedCandidate.rank}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-xs">
                              {rankedCandidate.match_score}% match
                            </Badge>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <h3 className="font-semibold text-sm sm:text-base text-primary hover:text-primary/80 cursor-pointer truncate">
                                {candidate.name}
                              </h3>
                              {candidate.public_id && (
                                <a 
                                  href={`https://www.linkedin.com/in/${candidate.public_id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 transition-colors"
                                >
                                  <IconExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{candidate.title}</p>
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 flex-wrap">
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
                              <IconBuilding className={`w-4 h-4 ${candidate.companyLogo ? 'hidden' : ''}`} />
                              <span>{candidate.company}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <IconMapPin className="w-4 h-4" />
                              <span>{candidate.location}</span>
                            </div>
                            {candidate.years_of_experience && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {candidate.years_of_experience} years exp
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* AI Analysis */}
                          <div className="mt-3">
                            <div className="flex items-start gap-2">
                              <div className="flex items-center mt-0.5 flex-shrink-0">
                                <IconSparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              </div>
                              <div className="relative flex-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-sm opacity-60"></div>
                                <p className="text-xs sm:text-sm text-foreground relative z-10 px-2 py-1">
                                  {rankedCandidate.summary}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Key Strengths */}
                          {rankedCandidate.key_strengths && rankedCandidate.key_strengths.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Key Strengths:</h4>
                              <div className="flex flex-wrap gap-1">
                                {rankedCandidate.key_strengths.map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Potential Concerns */}
                          {rankedCandidate.potential_concerns && rankedCandidate.potential_concerns.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Areas to Consider:</h4>
                              <div className="flex flex-wrap gap-1">
                                {rankedCandidate.potential_concerns.map((concern, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
                                    {concern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <IconDotsVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs sm:text-sm">
                                <IconBookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                Remove from List
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <IconUsersGroup className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
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

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        candidate={selectedCandidate}
      />
    </div>
  );
}