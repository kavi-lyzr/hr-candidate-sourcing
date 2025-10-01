"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Users, 
  Loader2,
  Info,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface Department {
  _id: string;
  name: string;
}

interface ParsedUser {
  email: string;
  role: string;
  department?: string;
  rowIndex: number;
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  valid: ParsedUser[];
  invalid: ParsedUser[];
  duplicates: ParsedUser[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

interface BulkUserImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: ParsedUser[]) => Promise<void>;
  departments: Department[];
  isAdmin: boolean;
  isManager: boolean;
}

const VALID_ROLES = ['employee', 'resolver', 'manager', 'admin'];
const DEFAULT_ROLE = 'employee';

export function BulkUserImport({ 
  isOpen, 
  onClose, 
  onImport, 
  departments,
  isAdmin,
  isManager 
}: BulkUserImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [skipHeader, setSkipHeader] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available roles based on user permissions
  const availableRoles = isAdmin 
    ? VALID_ROLES 
    : VALID_ROLES.filter(role => role !== 'admin');

  // Email validation
  const isValidEmail = (email: string) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  // Parse CSV content
  const parseCSV = useCallback((content: string): string[][] => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    return lines.map(line => {
      // Simple CSV parsing - handles basic cases
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }, []);

  // Validate parsed users
  const validateUsers = useCallback((rows: string[][]): ValidationResult => {
    const startIndex = skipHeader ? 1 : 0;
    const dataRows = rows.slice(startIndex);
    
    const parsed: ParsedUser[] = [];
    const emailSet = new Set<string>();
    
    // Debug: Log available departments
    console.log('Available departments:', departments.map(d => ({ id: d._id, name: d.name })));
    
    dataRows.forEach((row, index) => {
      const actualRowIndex = startIndex + index + 1; // 1-based for display
      const email = row[0]?.trim().toLowerCase() || '';
      const role = row[1]?.trim().toLowerCase() || DEFAULT_ROLE;
      const department = row[2]?.trim() || '';
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Validate email
      if (!email) {
        errors.push('Email is required');
      } else if (!isValidEmail(email)) {
        errors.push('Invalid email format');
      }
      
      // Validate role
      if (role && !availableRoles.includes(role)) {
        if (role === 'admin' && !isAdmin) {
          errors.push('You cannot assign admin role');
        } else {
          errors.push(`Invalid role: ${role}. Valid roles: ${availableRoles.join(', ')}`);
        }
      }
      
      // Validate department
      if (department && !departments.find(d => d.name.toLowerCase() === department.toLowerCase())) {
        console.log(`Department "${department}" not found in:`, departments.map(d => d.name));
        warnings.push(`Department "${department}" not found - will be ignored`);
      }
      
      // Check for duplicate emails
      if (email && emailSet.has(email)) {
        errors.push('Duplicate email in CSV');
      } else if (email) {
        emailSet.add(email);
      }
      
      const departmentId = department ? departments.find(d => d.name.toLowerCase() === department.toLowerCase())?._id : undefined;
      console.log(`User ${email}: department "${department}" -> ID: ${departmentId}`);
      
      parsed.push({
        email,
        role: role || DEFAULT_ROLE,
        department: departmentId,
        rowIndex: actualRowIndex,
        errors,
        warnings
      });
    });
    
    const valid = parsed.filter(user => user.errors.length === 0);
    const invalid = parsed.filter(user => user.errors.length > 0);
    const duplicates = parsed.filter(user => user.errors.some(e => e.includes('Duplicate')));
    
    return {
      valid,
      invalid,
      duplicates,
      summary: {
        total: parsed.length,
        valid: valid.length,
        invalid: invalid.length,
        duplicates: duplicates.length
      }
    };
  }, [skipHeader, departments, availableRoles, isAdmin]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      
      // Auto-validate
      const rows = parseCSV(content);
      const result = validateUsers(rows);
      setValidationResult(result);
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    if (csvFile) {
      handleFileSelect(csvFile);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!validationResult?.valid.length) return;
    
    setStep('importing');
    setImportProgress(0);
    
    try {
      // Process users with progress tracking
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      const totalUsers = validationResult.valid.length;
      
      for (let i = 0; i < validationResult.valid.length; i++) {
        const user = validationResult.valid[i];
        try {
          await onImport([user]); // Import one user at a time
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push(`Failed to import ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalUsers) * 100);
        setImportProgress(progress);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setStep('complete');
      setImportResults({
        successful: successCount,
        failed: failureCount,
        errors
      });
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        successful: 0,
        failed: validationResult.valid.length,
        errors: [error instanceof Error ? error.message : 'Import failed']
      });
      setStep('complete');
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const sampleData = [
      ['email', 'role', 'department'],
      ['john.doe@company.com', 'employee', 'Engineering'],
      ['jane.smith@company.com', 'manager', 'HR'],
      ['bob.wilson@company.com', 'resolver', '']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-users.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setStep('upload');
    setCsvFile(null);
    setCsvContent('');
    setValidationResult(null);
    setImportProgress(0);
    setImportResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl min-w-[60%] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Users
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Import Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">CSV Format</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Column 1: Email (required)</li>
                        <li>• Column 2: Role (optional, defaults to employee)</li>
                        <li>• Column 3: Department (optional)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Available Roles</h4>
                      <div className="flex flex-wrap gap-1">
                        {availableRoles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Available Departments</h4>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {departments.length > 0 ? (
                        departments.map(dept => (
                          <Badge key={dept._id} variant="secondary" className="text-xs">
                            {dept.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No departments created yet</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="skip-header" 
                        checked={skipHeader}
                        onCheckedChange={(checked) => setSkipHeader(checked as boolean)}
                      />
                      <Label htmlFor="skip-header" className="text-sm">
                        Skip first row (header)
                      </Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadSample}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardContent className="pt-6">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />
                    
                    {csvFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-green-500 mx-auto" />
                        <div>
                          <p className="font-medium">{csvFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Drop your CSV file here</p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Select CSV File
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Validation Results */}
              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validation Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{validationResult.summary.total}</div>
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{validationResult.summary.valid}</div>
                        <div className="text-sm text-muted-foreground">Valid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{validationResult.summary.invalid}</div>
                        <div className="text-sm text-muted-foreground">Invalid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{validationResult.summary.duplicates}</div>
                        <div className="text-sm text-muted-foreground">Duplicates</div>
                      </div>
                    </div>

                    {validationResult.summary.invalid > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {validationResult.summary.invalid} rows have validation errors. 
                          Only valid rows will be imported.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep('preview')}
                        disabled={validationResult.summary.total === 0}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Data
                      </Button>
                      <Button 
                        onClick={handleImport}
                        disabled={validationResult.summary.valid === 0}
                      >
                        Import {validationResult.summary.valid} Users
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 'preview' && validationResult && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Preview</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={handleImport} disabled={validationResult.summary.valid === 0}>
                    Import {validationResult.summary.valid} Users
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...validationResult.valid, ...validationResult.invalid]
                        .sort((a, b) => a.rowIndex - b.rowIndex)
                        .map((user) => (
                        <TableRow key={`${user.rowIndex}-${user.email}`}>
                          <TableCell>{user.rowIndex}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.errors.length > 0 ? "destructive" : "default"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.department ? 
                              departments.find(d => d._id === user.department)?.name || 'Unknown'
                              : <span className="text-muted-foreground">None</span>
                            }
                          </TableCell>
                          <TableCell>
                            {user.errors.length > 0 ? (
                              <div className="space-y-1">
                                <Badge variant="destructive">Invalid</Badge>
                                {user.errors.map((error, i) => (
                                  <div key={i} className="text-xs text-red-600">{error}</div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="default">Valid</Badge>
                                {user.warnings.map((warning, i) => (
                                  <div key={i} className="text-xs text-yellow-600">{warning}</div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Importing Users...</h3>
                <p className="text-muted-foreground">
                  Please wait while we add users to your organization
                </p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {importProgress}% complete
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && importResults && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                {importResults.successful > 0 ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
                <div className="space-y-2">
                  {importResults.successful > 0 && (
                    <p className="text-green-600">
                      Successfully imported {importResults.successful} users
                    </p>
                  )}
                  {importResults.failed > 0 && (
                    <p className="text-red-600">
                      Failed to import {importResults.failed} users
                    </p>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {importResults.errors.map((error, i) => (
                        <div key={i}>{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
