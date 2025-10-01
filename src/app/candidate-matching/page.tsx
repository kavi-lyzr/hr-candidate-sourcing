"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconChevronDown, IconSparkles, IconMapPin, IconBuilding, IconBookmark, IconUpload, IconUsersGroup } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
// Card components removed as they are not used
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Candidate {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  companyLogo?: string;
  selected?: boolean;
}

export default function CandidateMatching() {
  const [selectedJD, setSelectedJD] = useState("");
  const [jdDropdownOpen, setJdDropdownOpen] = useState(false);
  const [availableJDs, setAvailableJDs] = useState<Array<{id: string, name: string}>>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [candidateDatabase, setCandidateDatabase] = useState<Candidate[]>([
    {
      id: "1",
      name: "Jo Rhett",
      title: "Staff Engineer, Cloud Security And Infrastructure",
      company: "Tulip",
      location: "San Jose, California",
      summary: "Experienced cloud security engineer with 8+ years at leading tech companies, specializing in infrastructure automation and security protocols.",
      companyLogo: "https://download.tulip.co/assets/tulip-background-logo.png",
      selected: true
    },
    {
      id: "2", 
      name: "Erwin Jansen",
      title: "Software Engineer",
      company: "Google",
      location: "San Francisco, California",
      summary: "AI/ML software engineer with PhD in Computer Science, currently building next-generation search algorithms at Google.",
      companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png",
      selected: false
    },
    {
      id: "3",
      name: "Sarah Chen",
      title: "Senior Data Scientist", 
      company: "Spotify",
      location: "New York, New York",
      summary: "ML engineer specializing in recommendation systems and natural language processing, with expertise in Python and TensorFlow.",
      selected: true
    },
    {
      id: "4",
      name: "Nimish Kulkarni",
      title: "Senior Software Engineer",
      company: "Branch Metrics",
      location: "San Francisco, California", 
      summary: "Senior full-stack engineer with Stanford engineering background, expert in mobile attribution and deep linking technologies.",
      selected: false
    },
    {
      id: "5",
      name: "Alex Kumar",
      title: "DevOps Engineer",
      company: "Airbnb",
      location: "Austin, Texas",
      summary: "Cloud infrastructure specialist with 5+ years experience in Kubernetes, AWS, and automation tools for scalable systems.",
      selected: true
    }
  ]);

  const [rankedCandidates, setRankedCandidates] = useState<Candidate[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Load JDs from localStorage 
  useEffect(() => {
    const savedJDs = localStorage.getItem('jdLibrary');
    if (savedJDs) {
      try {
        const jds = JSON.parse(savedJDs);
        setAvailableJDs(jds.map((jd: { id: string; name: string }) => ({ id: jd.id, name: jd.name })));
      } catch (error) {
        console.error('Failed to load JDs:', error);
      }
    }
  }, []);

  const handleCandidateSelection = (candidateId: string) => {
    setCandidateDatabase(prev => 
      prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, selected: !candidate.selected }
          : candidate
      )
    );
  };

  const handleMatchCandidates = () => {
    const selectedCandidates = candidateDatabase.filter(c => c.selected);
    // Sort by match score (mock ranking)
    const ranked = [...selectedCandidates].sort((a, b) => {
      // Mock scoring based on summary length (placeholder logic)
      return b.summary.length - a.summary.length;
    });
    setRankedCandidates(ranked);
    setShowResults(true);
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
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setJdDropdownOpen(!jdDropdownOpen)}
                className="w-full justify-between h-12"
              >
                <span className="text-gray-700">
                  {selectedJD ? availableJDs.find(jd => jd.id === selectedJD)?.name : "Select a JD from library"}
                </span>
                <IconChevronDown className={`w-4 h-4 transition-transform ${jdDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {jdDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                  {availableJDs.length > 0 ? (
                    availableJDs.map((jd) => (
                      <button
                        key={jd.id}
                        onClick={() => {
                          setSelectedJD(jd.id);
                          setJdDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        {jd.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No JDs available. Create one in JD Library first.
                    </div>
                  )}
                </div>
              )}
            </div>
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
            
            <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-3">
                  {candidateDatabase.map((candidate) => (
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
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              {selectedCandidatesCount} of {candidateDatabase.length} candidates selected
            </div>
          </div>

          {/* Match Candidates Button */}
          <div>
            <Button 
              onClick={handleMatchCandidates}
              disabled={!selectedJD || selectedCandidatesCount === 0}
              className="w-full h-12 bg-gradient-to-r from-[#603BFC] to-[#A94FA1] hover:from-[#5235E8] hover:to-[#9A45A0] text-white"
            >
              <IconUsersGroup className="w-4 h-4 mr-2" />
              Match {selectedCandidatesCount} Candidates
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
            {showResults ? (
              <div className="p-4 space-y-4">
                {rankedCandidates.map((candidate, index) => (
                  <div key={candidate.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            #{index + 1}
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
                        </div>
                        <div className="mt-2">
                          <div className="flex items-start space-x-2">
                            <div className="flex items-center mt-0.5">
                              <IconSparkles className="h-4 w-4 text-[#603BFC]" />
                            </div>
                            <div className="relative flex-1">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent rounded-sm opacity-60"></div>
                              <p className="text-sm text-gray-700 italic relative z-10 px-2 py-1">
                                {candidate.summary}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="text-[#603BFC] border-[#603BFC] hover:bg-purple-50">
                          <IconBookmark className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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