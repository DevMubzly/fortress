import { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

// Initialize Supabase client
// Note: In a real production app, these should be env vars.
// For now, we will assume the user has configured them or we will use a placeholder if not.
// However, the user request implies we should make it work.
// I'll try to find the supabase config in the codebase or use the one I find.
// Check if 'lib/supabase.ts' exists in dashboard?
// If not, I'll instantiate it here.

// But wait, the dashboard is React Vite. It needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// I'll check for those environment variables or a config file.
// For now I'll create the component structure.

const SupportPage = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [ticketType, setTicketType] = useState("technical");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState("medium");
    
    // Check for Supabase config
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsLoading(true);
        const token = localStorage.getItem("fortress_token");

        try {
            const response = await fetch("http://localhost:8000/api/support/tickets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: ticketType,
                    subject,
                    message,
                    priority
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to submit ticket");
            }

            toast({
                title: "Ticket Submitted",
                description: "We've received your request and will get back to you shortly.",
            });
            
            // Reset form
            setSubject("");
            setMessage("");
            setTicketType("technical");
            setPriority("medium");

        } catch (error: any) {
            console.error('Error details:', error);
            toast({
                title: "Submission Failed",
                description: error.message || "Could not submit ticket. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Support & Help
                </h1>
                <p className="text-muted-foreground mt-2">
                  Get assistance with Fortress or report issues directly to our engineering team.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Information */}
                <div className="space-y-6">
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Contact Information
                            </CardTitle>
                            <CardDescription>
                                Reach out to us through official channels.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Phone Support</p>
                                    <p className="text-muted-foreground">+256 771 050 357</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Email Support</p>
                                    <p className="text-muted-foreground">bmubs15@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Office Location</p>
                                    <p className="text-muted-foreground">Kampala, Uganda</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-border/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <FileText className="h-5 w-5" />
                                Documentation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Browse our comprehensive documentation for guides, API references, and troubleshooting tips.
                            </p>
                            <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10" onClick={() => window.open('https://fortress-stack.tech/docs', '_blank')}>
                                View Documentation
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Ticket Form */}
                <Card className="glass border-border/50 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Submit a Ticket
                        </CardTitle>
                        <CardDescription>
                            Create a new support ticket. We usually respond within 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <Select value={ticketType} onValueChange={setTicketType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="technical">Technical Issue</SelectItem>
                                            <SelectItem value="billing">Billing</SelectItem>
                                            <SelectItem value="feature">Feature Request</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input 
                                    placeholder="Brief description of the issue"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea 
                                    placeholder="Please provide detailed information about your issue..."
                                    className="min-h-[150px]"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit Ticket
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SupportPage;
