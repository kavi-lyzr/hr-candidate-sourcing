"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Building, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface CandidateHoverCardProps {
  children: React.ReactNode;
  candidate: any;
  onViewDetails?: () => void;
}

export function CandidateHoverCard({ children, candidate, onViewDetails }: CandidateHoverCardProps) {
  if (!candidate) return <>{children}</>;

  const rawData = candidate.rawData || candidate;
  const fullName = rawData.full_name || candidate.name || "Unknown";
  const currentTitle = rawData.job_title || candidate.title || "No title";
  const currentCompany = rawData.company || candidate.company || "";
  const location = rawData.location || candidate.location || "";
  const about = rawData.about || candidate.summary || "";
  const linkedinUrl = rawData.linkedin_url || rawData.profile_url || candidate.linkedinUrl || "";
  const companyLogo = rawData.company_logo_url || candidate.companyLogo || "";

  // Truncate about to 150 characters
  const truncatedAbout = about.length > 150 ? `${about.substring(0, 150)}...` : about;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="start">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">{fullName}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{currentTitle}</p>
            </div>
            {companyLogo && (
              <Image
                src={companyLogo}
                alt={currentCompany}
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>

          {currentCompany && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{currentCompany}</span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {truncatedAbout && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {truncatedAbout}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex-1 text-xs h-8"
              >
                View Full Profile
              </Button>
            )}
            {linkedinUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

