'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconFileText, IconCalendar, IconEye, IconTrash, IconPlus } from '@tabler/icons-react';
import { IJobDescriptionDocument } from '@/models/jobDescription';
import { CreateJdDialog } from '@/components/CreateJdDialog';
import { ViewJdDialog } from '@/components/ViewJdDialog';
import { DeleteJdDialog } from '@/components/DeleteJdDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/AuthProvider';

export default function JDLibraryPage() {
  const { isAuthenticated, userId } = useAuth();
  const [jds, setJds] = useState<IJobDescriptionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedJd, setSelectedJd] = useState<IJobDescriptionDocument | null>(null);

  const fetchJds = async () => {
    if (!isAuthenticated || !userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jds?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch JDs');
      const data = await response.json();
      setJds(data);
    } catch (error) {
      console.error(error);
      // Here you might want to show a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchJds();
    }
  }, [isAuthenticated, userId]);

  const handleView = (jd: IJobDescriptionDocument) => {
    setSelectedJd(jd);
    setIsViewOpen(true);
  };

  const handleDelete = (jd: IJobDescriptionDocument) => {
    setSelectedJd(jd);
    setIsDeleteOpen(true);
  };

  const handleDeleteComplete = () => {
    // Store the ID before any state changes
    const idToDelete = selectedJd?._id.toString();

    // Optimistically remove the JD from the list immediately
    if (idToDelete) {
      setJds(prevJds => prevJds.filter(jd => jd._id.toString() !== idToDelete));
    }

    // Then fetch from server to ensure consistency (after a small delay)
    setTimeout(() => {
      fetchJds();
    }, 500);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Job Description Library</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your repository of job descriptions.</p>
        </div>
        <CreateJdDialog onJdCreated={fetchJds}>
          <Button className="w-full sm:w-auto">
            <IconPlus className="mr-2 h-4 w-4" /> Create New JD
          </Button>
        </CreateJdDialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <IconFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No job descriptions yet</h3>
            <p className="text-muted-foreground mb-4">Create your first job description to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
          {jds.map((jd) => (
            <Card key={jd._id.toString()} className="flex flex-col overflow-hidden">
              <CardContent className="p-4 flex flex-col">
                <div className="flex-grow min-h-0">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-1 min-h-[56px]">{jd.title}</h3>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                    <IconCalendar className="w-4 h-4 flex-shrink-0" />
                    <span>{new Date(jd.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="relative h-[60px] overflow-hidden">
                    <p className="text-sm text-muted-foreground line-clamp-3">{jd.content}</p>
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-card to-transparent" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleView(jd)} className="flex-1 sm:flex-none">
                    <IconEye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(jd)} className="flex-1 sm:flex-none">
                    <IconTrash className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ViewJdDialog jd={selectedJd} isOpen={isViewOpen} onOpenChange={setIsViewOpen} />
      <DeleteJdDialog jd={selectedJd} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} onJdDeleted={handleDeleteComplete} />
    </div>
  );
}
