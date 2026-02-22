"use client";

import { useEffect, useState } from "react";
import { Inbox, Mail, Building2, Calendar, MessageSquare, CheckCircle, Clock, Archive, X, History, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  organization: string;
  country: string;
  message: string;
  submittedAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'rejected' | 'archived';
}

const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    name: 'David Ochieng',
    email: 'd.ochieng@ministry.go.ke',
    organization: 'Ministry of ICT Kenya',
    country: 'Kenya',
    message: 'We are looking to deploy an AI gateway solution for our government agencies. Can we schedule a demo?',
    submittedAt: '2024-03-10 09:30',
    status: 'new',
  },
  {
    id: 'lead-002',
    name: 'Amina Abubakar',
    email: 'a.abubakar@cbz.gov.ng',
    organization: 'Central Bank of Nigeria',
    country: 'Nigeria',
    message: 'Interested in enterprise pricing and compliance features for financial sector.',
    submittedAt: '2024-03-09 14:15',
    status: 'new',
  },
  {
    id: 'lead-003',
    name: 'Jean-Pierre Mugabo',
    email: 'jp.mugabo@minict.gov.rw',
    organization: 'MINICT Rwanda',
    country: 'Rwanda',
    message: 'Looking for a proof of concept deployment. 50 users initially.',
    submittedAt: '2024-03-08 11:00',
    status: 'contacted',
  },
  {
    id: 'lead-004',
    name: 'Grace Nalwanga',
    email: 'g.nalwanga@ura.go.ug',
    organization: 'Uganda Revenue Authority',
    country: 'Uganda',
    message: 'Need AI solution with on-premise deployment option for data sovereignty.',
    submittedAt: '2024-03-07 16:45',
    status: 'qualified',
  },
  {
    id: 'lead-005',
    name: 'Mohammed Hassan',
    email: 'm.hassan@eia.gov.et',
    organization: 'Ethiopian Investment Authority',
    country: 'Ethiopia',
    message: 'Exploring AI tools for investment analysis.',
    submittedAt: '2024-03-05 10:00',
    status: 'rejected',
  },
  {
    id: 'lead-006',
    name: 'Sarah Kamau',
    email: 's.kamau@kcb.co.ke',
    organization: 'KCB Group',
    country: 'Kenya',
    message: 'Completed evaluation, moved to different vendor.',
    submittedAt: '2024-02-28 14:30',
    status: 'archived',
  },
];

// Skeleton loader
const LeadInboxSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
         <Skeleton className="h-full rounded-lg" />
         <Skeleton className="h-full md:col-span-2 rounded-lg" />
      </div>
    </div>
  );

export default function LeadInboxPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'contacted' | 'archived'>('all');
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set first lead as selected on load
  useEffect(() => {
    if (leads.length > 0 && !selectedLead) {
        setSelectedLead(leads[0]);
    }
  }, [leads, selectedLead]);

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return lead.status !== 'archived' && lead.status !== 'rejected';
    if (activeTab === 'archived') return lead.status === 'archived' || lead.status === 'rejected';
    return lead.status === activeTab;
  });

  const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
    toast({
      title: "Status Updated",
      description: `Lead marked as ${newStatus}.`,
    });
  };

  const handleSendReply = () => {
    if (!replyMessage) return;
    
    // Simulate sending email
    toast({
      title: "Reply Sent",
      description: `Replied to ${selectedLead?.email}`,
    });
    
    if (selectedLead && selectedLead.status === 'new') {
        handleStatusChange(selectedLead.id, 'contacted');
    }

    setReplyMessage("");
    setIsReplyDialogOpen(false);
  };

  if (isLoading) return <LeadInboxSkeleton />;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Lead Inbox</h2>
        <p className="text-gray-500">Manage incoming inquiries and requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Lead List */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'new', 'contacted', 'archived'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-full capitalize whitespace-nowrap transition-colors",
                                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {filteredLeads.length} Leads
                </div>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {filteredLeads.map((lead) => (
                        <button
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={cn(
                                "p-4 text-left border-b border-gray-50 transition-colors hover:bg-gray-50",
                                selectedLead?.id === lead.id ? "bg-blue-50/50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-gray-900 truncate pr-2">{lead.name}</span>
                                {lead.status === 'new' && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mb-2 truncate">{lead.organization}</div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{lead.country}</span>
                                <span className="text-[10px] text-gray-400">{lead.submittedAt.split(' ')[0]}</span>
                            </div>
                        </button>
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No leads found in this category.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>

        {/* Lead Detail */}
        <div className="md:col-span-8 lg:col-span-9 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            {selectedLead ? (
                <>
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedLead.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <Building2 className="w-4 h-4" />
                                {selectedLead.organization}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                    {selectedLead.country}
                                </Badge>
                                <Badge variant="secondary" className={cn(
                                    "capitalize",
                                    selectedLead.status === 'new' && "bg-blue-100 text-blue-700",
                                    selectedLead.status === 'contacted' && "bg-yellow-100 text-yellow-700",
                                    selectedLead.status === 'qualified' && "bg-green-100 text-green-700",
                                )}>
                                    {selectedLead.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedLead.id, 'archived')}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Archive
                             </Button>
                             <Button size="sm" onClick={() => setIsReplyDialogOpen(true)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Reply
                             </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6 max-w-3xl">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">From: {selectedLead.email}</span>
                                    <span className="text-xs text-gray-400 ml-auto">{selectedLead.submittedAt}</span>
                                </div>
                                <div className="bg-white p-4 rounded border border-gray-100 min-h-[100px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedLead.message}
                                </div>
                            </div>

                            {/* Actions Panel */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedLead.id, 'qualified')}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Mark Qualified
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedLead.id, 'contacted')}>
                                        <History className="w-4 h-4 mr-2 text-yellow-600" />
                                        Mark Contacted
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedLead.id, 'rejected')}>
                                        <X className="w-4 h-4 mr-2 text-red-600" />
                                        Mark Not Interested
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Inbox className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No lead selected</h3>
                    <p className="text-gray-500 max-w-sm mt-2">Select a lead from the list to view details and take action.</p>
                </div>
            )}
        </div>
      </div>

      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Textarea 
                    placeholder="Type your response here..." 
                    className="min-h-[200px]"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReply} className="bg-blue-600 hover:bg-blue-700">Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
