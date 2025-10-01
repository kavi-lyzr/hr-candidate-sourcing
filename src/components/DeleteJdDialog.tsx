'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAppToast } from '@/hooks/use-app-toast';
import { IJobDescriptionDocument } from '@/models/jobDescription';
import { IconLoader2 } from '@tabler/icons-react';

interface DeleteJdDialogProps {
  jd: IJobDescriptionDocument | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onJdDeleted: () => void;
}

export function DeleteJdDialog({ jd, isOpen, onOpenChange, onJdDeleted }: DeleteJdDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useAppToast();

  const handleDelete = async () => {
    if (!jd) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/jds/${jd._id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to delete JD');
      toast({ title: 'Success', description: 'Job description deleted.' });
      onJdDeleted();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete job description.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!jd) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the job description titled &quot;{jd.title}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} disabled={isLoading} variant="destructive">
              {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
