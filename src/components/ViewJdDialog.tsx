'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IJobDescriptionDocument } from '@/models/jobDescription';

interface ViewJdDialogProps {
  jd: IJobDescriptionDocument | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ViewJdDialog({ jd, isOpen, onOpenChange }: ViewJdDialogProps) {
  if (!jd) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{jd.title}</DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(jd.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="max-w-none h-[60vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans">{jd.content}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
