'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ticket, Clock, CheckCircle, RefreshCw, Search, Plus, Filter, Users, MessageSquare, Edit, AlertCircle, User, PackageOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { useOrganization } from '@/hooks/use-organization';

interface TicketData {
  _id: string;
  trackingNumber: number;
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_information' | 'resolved' | 'closed';
  createdBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignedTo: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  department?: {
    _id: string;
    name: string;
  };
  tags?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  _id: string;
  role: 'user' | 'agent' | 'system' | 'resolver';
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  isInternal?: boolean;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
  description?: string;
}

interface Assignee {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

function TicketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const orgId = searchParams.get('org');
  
  // Use organization hook with orgId
  const organizationData = orgId ? useOrganization(orgId) : {
    userRole: null,
    departments: [],
    isLoading: true,
    error: null,
    refreshDepartments: async () => {},
  };
  
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Partial<TicketData>>({});

  // Redirect if no organization selected
  useEffect(() => {
    if (!orgId) {
      router.push('/organizations');
      return;
    }
  }, [orgId, router]);
  // Memoized fetch tickets function to prevent unnecessary re-renders
  const fetchTickets = useCallback(async () => {
    if (!orgId || !userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId: orgId,
        userId: userId
      });
      
      if (selectedDepartment && selectedDepartment !== 'all') params.append('department', selectedDepartment);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedAssignee && selectedAssignee !== 'all') params.append('assignedTo', selectedAssignee);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/v1/tickets?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, selectedDepartment, selectedStatus, selectedAssignee, searchTerm]);

  // Fetch assignees (for managers/admins)
  const fetchAssignees = async () => {
    if (!orgId || !userId || !['manager', 'admin'].includes(organizationData.userRole || '')) return;
    
    try {
      const response = await fetch(`/api/v1/organizations/${orgId}/assignees?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignees(data.assignees);
      }
    } catch (error) {
      console.error('Error fetching assignees:', error);
    }
  };

  // Memoized fetch ticket messages function
  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}/messages?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTicketMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [userId]);

  // Add message to ticket
  const addMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !userId) return;
    
    try {
      const response = await fetch(`/api/v1/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newMessage,
          userId: userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        fetchTicketMessages(selectedTicket._id);
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  // Update ticket
  const updateTicket = async () => {
    if (!selectedTicket || !userId) return;
    
    try {
      const response = await fetch(`/api/v1/tickets/${selectedTicket._id}?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTicket)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsEditMode(false);
        setSelectedTicket(data.ticket);
        fetchTickets(); // Refresh tickets list
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm) {
      fetchTickets();
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchTickets();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchTickets]);

  // Effect for non-search filters (immediate)
  useEffect(() => {
    if (orgId) {
      fetchTickets();
      organizationData.refreshDepartments();
      fetchAssignees();
    }
  }, [orgId, selectedDepartment, selectedStatus, selectedAssignee]);

  // Handle ticket click
  const handleTicketClick = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setEditedTicket(ticket);
    fetchTicketMessages(ticket._id);
  };

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'pending_information': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Can user edit tickets?
  const canEditTickets = ['admin', 'manager', 'resolver'].includes(organizationData.userRole || '');
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tickets...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tickets Management</h1>
        <p className="text-muted-foreground">
          {organizationData.userRole === 'employee' 
            ? 'View and manage your support requests' 
            : 'Manage and track all support requests across departments'
          }
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
            {/* <div className="h-4 w-4 rounded-full border-2 border-red-600"></div> */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Information</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending_information || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {organizationData.departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_information">Pending Information</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {canEditTickets && (
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee._id} value={assignee._id}>
                        {assignee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchTickets}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                {canEditTickets && <TableHead>Department</TableHead>}
                {canEditTickets && <TableHead>Priority</TableHead>}
                <TableHead>Status</TableHead>
                {canEditTickets && <TableHead>Assignee</TableHead>}
                <TableHead>Created</TableHead>
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleTicketClick(ticket)}>
                  <TableCell>#{ticket.trackingNumber}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                  {canEditTickets && (
                    <TableCell>{ticket.department?.name || '-'}</TableCell>
                  )}
                  {canEditTickets && (
                    <TableCell>
                      <Badge variant="secondary" className={`${getPriorityColor(ticket.priority)} text-white`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(ticket.status)} text-white`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  {canEditTickets && (
                    <TableCell>
                      {ticket.assignedTo.length > 0 ? (
                        <div className="flex -space-x-2">
                          {ticket.assignedTo.slice(0, 3).map((assignee) => (
                            <div key={assignee._id} className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-medium">
                              {assignee.name.charAt(0)}
                            </div>
                          ))}
                          {ticket.assignedTo.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">
                              +{ticket.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  {/* <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTicketClick(ticket);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[80%] xl:min-w-[60%] min-h-[80%] p-8 xl:p-12 overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket #{selectedTicket?.trackingNumber} - {selectedTicket?.title}</span>
              {canEditTickets && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* Left Panel - Ticket Details */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 mt-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedTicket.title || ''}
                      onChange={(e) => setEditedTicket({...editedTicket, title: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedTicket.description || ''}
                      onChange={(e) => setEditedTicket({...editedTicket, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 mt-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={editedTicket.status} 
                        onValueChange={(value) => setEditedTicket({...editedTicket, status: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='w-full'>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending_information">Pending Information</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {canEditTickets && (
                      <div className="flex flex-col gap-2 mt-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={editedTicket.priority} 
                          onValueChange={(value) => setEditedTicket({...editedTicket, priority: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className='w-full'>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                    <Button onClick={updateTicket}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                    <p className="mt-1 max-h-64 overflow-y-auto">{selectedTicket?.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                      <Badge variant="secondary" className={`${getStatusColor(selectedTicket?.status || '')} text-white mt-1`}>
                        {selectedTicket?.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {canEditTickets && (
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Priority</h3>
                        <Badge variant="secondary" className={`${getPriorityColor(selectedTicket?.priority || '')} text-white mt-1`}>
                          {selectedTicket?.priority}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {canEditTickets && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Department</h3>
                      <p className="mt-1">{selectedTicket?.department?.name || 'Unassigned'}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Created By</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      <span>{selectedTicket?.createdBy.name} ({selectedTicket?.createdBy.email})</span>
                    </div>
                  </div>
                  {canEditTickets && selectedTicket?.assignedTo && selectedTicket.assignedTo.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Assigned To</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTicket.assignedTo.map((assignee) => (
                          <Badge key={assignee._id} variant="outline">
                            {assignee.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Messages */}
            <div className="w-1/2 border-l pl-6 flex flex-col">
              <h3 className="font-medium mb-4">Conversation</h3>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {ticketMessages.map((message) => (
                    <div key={message._id} className={`flex gap-3 ${
                      message.userId._id === userId ? 'flex-row-reverse' : ''
                    }`}>
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                        {message.userId.name.charAt(0)}
                      </div>
                      <div className={`flex-1 ${message.userId._id === userId ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.userId.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={`rounded-lg px-3 py-2 ${
                          message.userId._id === userId 
                            ? 'bg-primary text-white' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={addMessage} disabled={!newMessage.trim()}>
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketsPageContent />
    </Suspense>
  );
}