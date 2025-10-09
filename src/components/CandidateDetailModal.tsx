"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building, MapPin, GraduationCap, Briefcase, Calendar, ExternalLink } from "lucide-react";
import Image from "next/image";

interface CandidateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any; // Full raw LinkedIn profile data
}

export function CandidateDetailModal({ open, onOpenChange, candidate }: CandidateDetailModalProps) {
  if (!candidate) return null;

  const rawData = candidate.rawData || candidate;
  const fullName = rawData.full_name || candidate.name || "Unknown Candidate";
  const currentTitle = rawData.job_title || candidate.title || "No title available";
  const currentCompany = rawData.company || candidate.company || "No company";
  const location = rawData.location || candidate.location || "Location not specified";
  const about = rawData.about || candidate.summary || "";
  const linkedinUrl = rawData.linkedin_url || rawData.profile_url || candidate.linkedinUrl || `https://www.linkedin.com/in/${rawData.public_id || candidate.public_id}`;
  const companyLogo = rawData.company_logo_url || candidate.companyLogo || "";
  
  // Sort experiences by recency (current first, then by start year descending)
  const experiences = rawData.experiences || [];
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return (b.start_year || 0) - (a.start_year || 0);
  });

  const educations = rawData.educations || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[33%] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="sr-only">{fullName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] pr-4">
          <div className="space-y-6 p-2">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">{fullName}</h2>
                <p className="text-lg text-muted-foreground mb-2">{currentTitle}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {currentCompany && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span>{currentCompany}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
                <Button asChild variant="default" size="sm" className="gap-2">
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View LinkedIn Profile
                  </a>
                </Button>
              </div>
              {companyLogo && (
                <div className="flex-shrink-0">
                  <Image
                    src={companyLogo}
                    alt={currentCompany}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* About Section */}
            {about && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    About
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {about}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Experience Section */}
            {sortedExperiences.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Experience
                  </h3>
                  <div className="space-y-6">
                    {sortedExperiences.map((exp: any, index: number) => (
                      <div key={index} className="relative pl-8 border-l-2 border-border pb-6 last:pb-0">
                        <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base text-foreground">{exp.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {exp.company_logo_url && (
                                <Image
                                  src={exp.company_logo_url}
                                  alt={exp.company}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 object-contain rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="text-sm font-medium text-foreground">{exp.company}</span>
                            </div>
                          </div>
                          {exp.is_current && (
                            <Badge variant="default" className="ml-2">Current</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{exp.date_range}</span>
                          {exp.duration && <span>• {exp.duration}</span>}
                        </div>
                        
                        {exp.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                        
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                        
                        {exp.skills && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-muted-foreground">Skills: {exp.skills}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Education Section */}
            {educations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Education
                </h3>
                <div className="space-y-4">
                  {educations.map((edu: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      {edu.school_logo_url && (
                        <div className="flex-shrink-0">
                          <Image
                            src={edu.school_logo_url}
                            alt={edu.school}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain rounded-lg border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-foreground">{edu.school}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {edu.degree && edu.field_of_study 
                            ? `${edu.degree} in ${edu.field_of_study}`
                            : edu.degree || edu.field_of_study || 'Degree not specified'}
                        </p>
                        {edu.date_range && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {edu.date_range}
                          </p>
                        )}
                        {edu.activities && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {edu.activities}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

