"use client";

import { useState } from "react";
import { IconX, IconBuilding, IconMapPin, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Select components removed as they are not used
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter removed as it is not used
} from "@/components/ui/dialog";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveChanges?: () => void;
}

export function FilterDialog({ open, onOpenChange, onSaveChanges }: FilterDialogProps) {
  const [locations, setLocations] = useState([
    "San Francisco", "San Jose", "Oakland", "Mountain View"
  ]);
  const [newLocation, setNewLocation] = useState("");

  const [companies, setCompanies] = useState([
    { name: "CrowdStrike", type: "security" },
    { name: "Palo Alto Networks", type: "security" },
    { name: "Google", type: "tech" },
    { name: "Microsoft", type: "tech" }
  ]);
  const [newCompany, setNewCompany] = useState("");

  const [jobTitles, setJobTitles] = useState([
    "Software Engineer", "Senior Software Engineer", "Staff Engineer"
  ]);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [universities, setUniversities] = useState([
    "Stanford University", "UC Berkeley", "MIT"
  ]);
  const [newUniversity, setNewUniversity] = useState("");

  const [minExperience, setMinExperience] = useState("4");
  const [maxExperience, setMaxExperience] = useState("10");

  const removeLocation = (locationToRemove: string) => {
    setLocations(locations.filter(loc => loc !== locationToRemove));
  };

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const addCompany = () => {
    if (newCompany.trim() && !companies.find(c => c.name === newCompany.trim())) {
      setCompanies([...companies, { name: newCompany.trim(), type: "custom" }]);
      setNewCompany("");
    }
  };

  const removeCompany = (companyName: string) => {
    setCompanies(companies.filter(c => c.name !== companyName));
  };

  const addJobTitle = () => {
    if (newJobTitle.trim() && !jobTitles.includes(newJobTitle.trim())) {
      setJobTitles([...jobTitles, newJobTitle.trim()]);
      setNewJobTitle("");
    }
  };

  const removeJobTitle = (titleToRemove: string) => {
    setJobTitles(jobTitles.filter(title => title !== titleToRemove));
  };

  const addUniversity = () => {
    if (newUniversity.trim() && !universities.includes(newUniversity.trim())) {
      setUniversities([...universities, newUniversity.trim()]);
      setNewUniversity("");
    }
  };

  const removeUniversity = (universityToRemove: string) => {
    setUniversities(universities.filter(uni => uni !== universityToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">Confirm your search filters</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Review and adjust your search criteria to find the best candidates.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button className="h-8" onClick={onSaveChanges}>Confirm</Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Titles Section - FIRST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Job Titles</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Start typing a job title and add to your search criteria
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {jobTitles.map((title) => (
                <Badge key={title} variant="outline" className="h-7 px-2 gap-1">
                  <span>{title}</span>
                  <button 
                    className="ml-1 hover:text-red-500" 
                    onClick={() => removeJobTitle(title)}
                    type="button"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Add job title..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addJobTitle()}
              />
              <Button size="sm" onClick={addJobTitle} disabled={!newJobTitle.trim()}>
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Companies Section - SECOND */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Companies</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Tech companies, startups, enterprise organizations
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {companies.map((company) => (
                <Badge key={company.name} variant="outline" className="h-7 px-2 gap-1">
                  <IconBuilding className="w-3 h-3 text-blue-500" />
                  <span>{company.name}</span>
                  <button 
                    className="ml-1 hover:text-red-500" 
                    onClick={() => removeCompany(company.name)}
                    type="button"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Add company name..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addCompany()}
              />
              <Button size="sm" onClick={addCompany} disabled={!newCompany.trim()}>
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Location Section - THIRD */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Location(s)</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Examples: San Francisco / United States / NYC / California...
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {locations.map((location) => (
                <Badge key={location} variant="outline" className="h-7 px-2 gap-1">
                  <IconMapPin className="w-3 h-3 text-blue-500" />
                  <span>{location}</span>
                  <button 
                    className="ml-1 hover:text-red-500" 
                    onClick={() => removeLocation(location)}
                    type="button"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add new location..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
              />
              <Button size="sm" onClick={addLocation} disabled={!newLocation.trim()}>
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Experience Section - FOURTH */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Min Experience (Years)</h3>
              <Input 
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                placeholder="4"
                className="w-full"
              />
            </div>
            <div>
              <h3 className="font-medium mb-3">Max Experience (Years)</h3>
              <Input 
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value)}
                placeholder="Example: 10 years"
                className="w-full"
              />
            </div>
          </div>

          {/* Universities - FIFTH */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Universities</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Add universities to filter candidates by their educational background
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {universities.map((university) => (
                <Badge key={university} variant="outline" className="h-7 px-2 gap-1">
                  <span>{university}</span>
                  <button 
                    className="ml-1 hover:text-red-500" 
                    onClick={() => removeUniversity(university)}
                    type="button"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={newUniversity}
                onChange={(e) => setNewUniversity(e.target.value)}
                placeholder="Add university name..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addUniversity()}
              />
              <Button size="sm" onClick={addUniversity} disabled={!newUniversity.trim()}>
                <IconPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}