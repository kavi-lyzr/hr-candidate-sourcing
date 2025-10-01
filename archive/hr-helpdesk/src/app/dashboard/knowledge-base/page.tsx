"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast"; // Will implement custom notifications
import { useAuth } from "@/lib/AuthProvider";
import { FileText, Bot, Upload, Search, Trash2, Settings, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';


const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface Document {
  _id: string;
  title: string;
  fileName: string;
  originalFileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileSize: number;
  status: 'processing' | 'active' | 'failed' | 'deleted';
  documentCount?: number;
  processingError?: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  _id: string;
  currentOrganization: string;
  name: string;
  email: string;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(true);
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userId, isAuthenticated } = useAuth();

  // Get user data and current organization
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isAuthenticated) return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get('org');

        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          let currentOrgId = '';
          let userName = data.user?.name || 'User';
          let userEmail = data.user?.email || '';

          if (orgId && data.organizations) {
            const org = data.organizations.find((o: any) => o._id === orgId);
            if (org) {
              currentOrgId = orgId;
            }
          }
          
          if (!currentOrgId && data.organizations?.length > 0) {
            currentOrgId = data.organizations[0]._id;
          }

          if (currentOrgId) {
            setUserData({
              _id: userId,
              currentOrganization: currentOrgId,
              name: userName,
              email: userEmail,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage('Failed to load user data');
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!userData?.currentOrganization) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/knowledge-base?organizationId=${userData.currentOrganization}&userId=${userData._id}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      } else {
        setErrorMessage(data.error || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setErrorMessage('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  // Load system instructions
  const loadSystemInstructions = useCallback(async () => {
    if (!userData?.currentOrganization) return;

    setIsLoadingInstructions(true);
    try {
      const response = await fetch(`/api/v1/organizations/${userData.currentOrganization}/system-instructions`);
      const data = await response.json();

      if (data.success) {
        setSystemInstructions(data.systemInstruction || '');
      } else {
        setErrorMessage(data.error || 'Failed to load system instructions');
      }
    } catch (error) {
      console.error('Error loading system instructions:', error);
      setErrorMessage('Failed to load system instructions');
    } finally {
      setIsLoadingInstructions(false);
    }
  }, [userData?.currentOrganization]);

  // Load data when userData is available
  useEffect(() => {
    if (userData) {
      loadDocuments();
      loadSystemInstructions();
    }
  }, [userData, loadDocuments, loadSystemInstructions]);

  // Note: Polling removed since we now process documents synchronously

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // File validation
  const validateFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, DOCX, and TXT files are supported';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024} MB`;
    }
    
    return null;
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !userData) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(true);

    try {
      // Step 1: Upload file to Vercel Blob
      console.log('Starting Vercel Blob upload for file:', file.name, 'Size:', file.size);
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      console.log('Vercel Blob upload successful:', blob);

      // Step 2: Call API with blob URL for processing
      const requestBody = {
        blobUrl: blob.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        organizationId: userData.currentOrganization,
        userId: userData._id
      };
      
      console.log('Sending request body:', requestBody);
      
      const response = await fetch('/api/v1/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('API response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('API response data:', data);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        setErrorMessage('Failed to parse server response');
        return;
      }

      if (data.success) {
        setSuccessMessage('Document uploaded successfully and is being processed!');
        loadDocuments(); // Reload documents list
      } else {
        setErrorMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Upload failed. Please try again.');
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    if (!userData || !confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/knowledge-base?documentId=${documentId}&organizationId=${userData.currentOrganization}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Document deleted successfully');
        loadDocuments(); // Reload documents list
      } else {
        setErrorMessage(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('Failed to delete document');
    }
  };

  // Save system instructions
  const saveSystemInstructions = async () => {
    if (!userData) return;

    setIsSavingInstructions(true);
    try {
      const response = await fetch(`/api/v1/organizations/${userData.currentOrganization}/system-instructions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: systemInstructions,
          userId: userData._id
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('AI configuration saved successfully');
      } else {
        setErrorMessage(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      setErrorMessage('Failed to save configuration');
    } finally {
      setIsSavingInstructions(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dismiss notifications
  const dismissMessage = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">Manage knowledge base and AI system configuration</p>
      </div>

      {/* Success/Error Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-3 h-5 w-5 text-red-400" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissMessage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-5 w-5 text-green-400" />
              <p className="text-green-800">{successMessage}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissMessage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="knowledge-base">
        <TabsList>
          <TabsTrigger value="knowledge-base"><FileText className="mr-2 h-4 w-4" /> Knowledge Base</TabsTrigger>
          <TabsTrigger value="configuration"><Bot className="mr-2 h-4 w-4" /> AI Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base" className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : uploadProgress
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadProgress ? (
                  <>
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-primary font-medium">Processing document...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we parse and add your document to the knowledge base.
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Drag and drop files here, or{' '}
                      <Button 
                        variant="link" 
                        className="p-0 text-primary" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </Button>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supported formats: PDF, DOCX, TXT (Max size: 100MB)
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                <div className="relative max-w-md flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
                          </p>
                          {!searchQuery && (
                            <Button
                              className="mt-4"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Your First Document
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc._id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{doc.title}</div>
                              {doc.documentCount && (
                                <div className="text-xs text-muted-foreground">
                                  {doc.documentCount} chunk{doc.documentCount > 1 ? 's' : ''} created
                                </div>
                              )}
                              {doc.processingError && (
                                <div className="text-xs text-destructive mt-1">
                                  Error: {doc.processingError}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="uppercase">{doc.fileType}</TableCell>
                          <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                          <TableCell>{doc.uploadedBy.name}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(doc.status)}>
                              {doc.status === 'processing' && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDocument(doc._id)}
                              disabled={doc.status === 'processing'}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>System Instructions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how the AI assistant behaves and responds to user queries.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingInstructions ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <Textarea
                    rows={12}
                    placeholder="Enter system instructions for the AI assistant..."
                    value={systemInstructions}
                    onChange={(e) => setSystemInstructions(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={saveSystemInstructions}
                      disabled={isSavingInstructions}
                    >
                      {isSavingInstructions ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="mr-2 h-4 w-4" />
                      )}
                      Save Configuration
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}