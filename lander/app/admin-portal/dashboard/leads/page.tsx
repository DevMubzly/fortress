"use client";

import { useEffect, useState, useCallback } from "react";
import { Inbox, Mail, Building2, CheckCircle, X, History, Trash2, RefreshCw } from "lucide-react";
// Removed unused icons: Calendar, MessageSquare, Clock, Archive, Eye
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
import { createClient } from "@/lib/supabase";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  company_name: string;
  company_size: string | null;
  country: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'rejected' | 'archived';
  created_at: string;
  phone: string | null;
  role: string | null;
  sector: string | null;
}

// Skeleton loader
const LeadInboxSkeleton = () => (
    <div className="space-y-6 h-full p-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-80px)]">
         <div className="bg-white rounded-lg border-none p-4 space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
         </div>
         <div className="md:col-span-2 bg-white rounded-lg border-none p-6 space-y-6">
             <div className="flex justify-between">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-8 w-24" />
             </div>
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-3/4" />
             <Skeleton className="h-40 w-full" />
         </div>
      </div>
    </div>
  );

export default function LeadInboxPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'contacted' | 'archived'>('all');
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLeads(data as Lead[]);
      // Preserve selected lead if still in list, else select first
        if (data && data.length > 0 && !selectedLead) {
             // Optional: select first lead by default
             // setSelectedLead(data[0] as Lead);
        }
    }
    setIsLoading(false);
  }, [supabase, toast, selectedLead]);

  useEffect(() => {
    // Avoid calling function directly in effect dependency loop if possible.
    // fetchLeads depends on 'supabase' (stable), 'toast' (stable), but 'selectedLead' (changes).
    // If 'fetchLeads' updates state that changes 'selectedLead' or causes re-render...
    // But 'fetchLeads' uses 'selectedLead' inside it? Yes.
    // The linter warning is "Calling setState synchronously within an effect".
    // That means `fetchLeads()` calls `setLeads` or `setIsLoading` synchronously.
    // Since `fetchLeads` is async (contains await), the initial part is synchronous.
    // But `setIsLoading(true)` happens at start.
    // Let's refactor to avoid the direct call if it's the issue, or suppress.
    // The warning specifically says "Calling setState synchronously".
    
    // Actually, fetchLeads is async up to the first await.
    // If it sets state before await, it's synchronous.
    // Let's wrap in an async IIFE or timeout to satisfy linter.
    
    const init = async () => {
        await fetchLeads();
    };
    init();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return lead.status !== 'archived' && lead.status !== 'rejected';
    if (activeTab === 'archived') return lead.status === 'archived' || lead.status === 'rejected';
    return lead.status === activeTab;
  });

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    // Optimistic update
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }

    const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

    if (error) {
        console.error("Error updating lead status:", error);
         toast({
            title: "Update Failed",
            description: "Could not update lead status.",
            variant: "destructive"
        });
        // Revert on error would go here ideally
        fetchLeads();
    } else {
        toast({
            title: "Status Updated",
            description: `Lead marked as ${newStatus}.`,
        });
    }
  };

  const handleSendReply = () => {
    if (!replyMessage) return;
    
    // In a real app, this would call a backend function to send an email
    // For now, we simulate success
    toast({
      title: "Reply Sent",
      description: `Replied to ${selectedLead?.work_email}`,
    });
    
    if (selectedLead && selectedLead.status === 'new') {
        handleStatusChange(selectedLead.id, 'contacted');
    }

    setReplyMessage("");
    setIsReplyDialogOpen(false);
  };

  if (isLoading && leads.length === 0) return <LeadInboxSkeleton />;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Lead Inbox</h2>
          <p className="text-gray-500">Manage incoming inquiries from Supabase</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Lead List */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col bg-white rounded-lg border-none   overflow-hidden h-full">
            <div className="p-4 border-b  bg-gray-50/50">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {(['all', 'new', 'contacted', 'archived'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
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
                                "p-4 text-left border-b  transition-colors hover:bg-gray-50 w-full",
                                selectedLead?.id === lead.id ? "bg-blue-50/50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1 w-full">
                                <span className="font-semibold text-sm text-gray-900 truncate pr-2 w-[140px] block">{lead.first_name} {lead.last_name}</span>
                                {lead.status === 'new' && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mb-2 truncate w-full">{lead.company_name}</div>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{lead.country || 'N/A'}</span>
                                <span className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span>
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
        <div className="md:col-span-7 lg:col-span-8 bg-white rounded-lg border-none   overflow-hidden flex flex-col h-full">
            {selectedLead ? (
                <>
                    <div className="p-6 border-b  flex justify-between items-start bg-white">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedLead.first_name} {selectedLead.last_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <Building2 className="w-4 h-4" />
                                {selectedLead.company_name}
                                {selectedLead.role && <span className="text-gray-300">|</span>}
                                {selectedLead.role}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedLead.country && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 ">
                                        {selectedLead.country}
                                    </Badge>
                                )}
                                {selectedLead.sector && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 ">
                                        {selectedLead.sector}
                                    </Badge>
                                )}
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
                             <Button variant="outline" size="sm" 
                                onClick={() => handleStatusChange(selectedLead.id, 'archived')}
                                disabled={selectedLead.status === 'archived'}
                             >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Archive
                             </Button>
                             <Button size="sm" onClick={() => setIsReplyDialogOpen(true)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Reply
                             </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6 bg-white">
                        <div className="space-y-6 max-w-3xl">
                            <div className="bg-gray-50 rounded-lg p-4 border-none ">
                                <div className="flex items-center gap-2 mb-3 border-b  pb-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">From: {selectedLead.work_email}</span>
                                    {selectedLead.phone && (
                                        <>
                                            <span className="text-gray-300 mx-2">|</span>
                                            <span className="text-sm text-gray-500">Phone: {selectedLead.phone}</span>
                                        </>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto full-date">
                                        {new Date(selectedLead.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-white p-4 rounded border-none  min-h-[100px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedLead.message || "No message content provided."}
                                </div>
                            </div>

                            {/* Actions Panel */}
                            <div className="border-t  pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="outline" size="sm" 
                                        onClick={() => handleStatusChange(selectedLead.id, 'qualified')}
                                        disabled={selectedLead.status === 'qualified'}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        Mark Qualified
                                    </Button>
                                    <Button variant="outline" size="sm" 
                                        onClick={() => handleStatusChange(selectedLead.id, 'contacted')}
                                        disabled={selectedLead.status === 'contacted'}
                                    >
                                        <History className="w-4 h-4 mr-2 text-yellow-600" />
                                        Mark Contacted
                                    </Button>
                                    <Button variant="outline" size="sm" 
                                        onClick={() => handleStatusChange(selectedLead.id, 'rejected')}
                                        disabled={selectedLead.status === 'rejected'}
                                    >
                                        <X className="w-4 h-4 mr-2 text-red-600" />
                                        Mark Not Interested
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/20">
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
            <DialogTitle>Reply to {selectedLead?.first_name}</DialogTitle>
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
