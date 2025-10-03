'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppToast } from '@/hooks/use-app-toast';
import { IconLoader2 } from '@tabler/icons-react';

interface CreateJdDialogProps {
  onJdCreated: () => void;
  children: React.ReactNode;
}

export function CreateJdDialog({ onJdCreated, children }: CreateJdDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useAppToast();

  // State for manual entry
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // State for file upload
  const [file, setFile] = useState<File | null>(null);

  const handleManualSubmit = async () => {
    if (!title || !content) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide both a title and content.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/jds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error('Failed to create JD');
      toast({ title: 'Success', description: 'Job description created.' });
      onJdCreated();
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create job description.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a file to upload.' });
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/jds', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      toast({ title: 'Success', description: 'File uploaded and JD created.' });
      onJdCreated();
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] min-h-fit h-[50%] flex flex-col">
        <DialogHeader className="h-16 max-h-16">
          <DialogTitle>Create New Job Description</DialogTitle>
          <DialogDescription>Add a new JD by entering the details manually or uploading a file.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-4 py-4 h-[300px]">
            <Input placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Job description content..." value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
            <Button onClick={handleManualSubmit} disabled={isLoading}>
              {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />} Create JD
            </Button>
          </TabsContent>
          <TabsContent value="upload" className="space-y-4 py-4 h-[300px]">
            <Input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-sm text-muted-foreground">Supported formats: PDF, DOCX, TXT.</p>
            <Button onClick={handleFileSubmit} disabled={isLoading || !file}>
              {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />} Upload and Create
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
