import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Send,
  Shield,
  User,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  RefreshCw,
  MoreVertical,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatConversation {
  id: string;
  title: string;
  updated_at: string;
  model: string;
}

interface Model {
  id: string;
  name: string;
  status: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChat, setEditingChat] = useState<ChatConversation | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    fetchModels();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchModels = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/models");
      if (res.ok) {
        const data = await res.json();
        const installed = data.filter((m: any) => m.status === 'installed');
        setModels(installed);
        if (installed.length > 0 && !selectedModel) {
            setSelectedModel(installed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch models", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("fortress_token");
      const res = await fetch(`http://localhost:8000/api/chat/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        setSelectedChatId(id);
        if (data.conversation.model) {
             // Only set if installed, otherwise keep current or fallback
             const isInstalled = models.find(m => m.id === data.conversation.model);
             if (isInstalled) setSelectedModel(data.conversation.model);
        }
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to load conversation", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch(`http://localhost:8000/api/chat/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChatHistory(prev => prev.filter(c => c.id !== id));
        if (selectedChatId === id) {
           setMessages([]);
           setSelectedChatId(null);
        }
        toast({ title: "Success", description: "Conversation deleted" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const handleRenameChat = async () => {
    if (!editingChat || !newTitle.trim()) return;
    try {
        const token = localStorage.getItem("fortress_token");
        const res = await fetch(`http://localhost:8000/api/chat/history/${editingChat.id}`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ title: newTitle })
        });
        
        if (res.ok) {
            setChatHistory(prev => prev.map(c => c.id === editingChat.id ? { ...c, title: newTitle } : c));
            setEditingChat(null);
            setNewTitle("");
            toast({ title: "Success", description: "Chat renamed" });
        } else {
            throw new Error("Failed to rename");
        }
    } catch (e) {
        toast({ title: "Error", description: "Failed to rename chat", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!selectedModel) {
        toast({ title: "Error", description: "No model selected or installed", variant: "destructive" });
        return;
    }

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("fortress_token");
      const res = await fetch("http://localhost:8000/api/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages,
          conversation_id: selectedChatId
        })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMsg = "";
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
             if (data.id && !selectedChatId) {
                setSelectedChatId(data.id);
                // Don't refetch history immediately to avoid jump, wait for end
             }
             if (data.content) {
               assistantMsg += data.content;
               setMessages(prev => {
                 const updated = [...prev];
                 updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
                 return updated;
               });
             }
          } catch (e) {
            console.error("Error parsing chunk", e);
          }
        }
      }
      
      fetchHistory();

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate response", variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setMessages([]);
  };

  const filteredHistory = chatHistory.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r bg-card/30 flex flex-col">
        <div className="p-4 border-b space-y-4">
           <div>
              <h2 className="text-sm font-semibold mb-1">Personal Workspace</h2>
              <p className="text-[10px] text-muted-foreground leading-tight">
                This workspace uses a unified platform key for model access.
              </p>
           </div>
           <Button onClick={handleNewChat} className="w-full justify-start gap-2 shadow-sm" variant="default">
             <Plus className="w-4 h-4" /> New Chat
           </Button>
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search conversations..." 
               className="pl-9 h-9 bg-background/50" 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
        </div>
        <ScrollArea className="flex-1">
           <div className="flex flex-col gap-1 p-2">
             {filteredHistory.map(chat => (
               <div 
                 key={chat.id}
                 className={cn(
                   "group flex items-center justify-between p-2.5 rounded-md text-sm hover:bg-accent/50 cursor-pointer transition-colors",
                   selectedChatId === chat.id && "bg-accent shadow-sm font-medium"
                 )}
                 onClick={() => loadConversation(chat.id)}
               >
                 <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className={cn("w-4 h-4 shrink-0", selectedChatId === chat.id ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate">{chat.title || "New Chat"}</span>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={(e) => { 
                           e.stopPropagation(); 
                           setNewTitle(chat.title || "");
                           setEditingChat(chat); 
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Rename
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteConversation(chat.id); }} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             ))}
           </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header removed as requested, keeping it clean */}
        
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
           <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">How can I help you today?</h3>
                      <p className="text-sm max-w-md mx-auto">
                        Fortress is ready. Select a model below to begin your secure session.
                      </p>
                   </div>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === "user" ? "justify-end" : "justify-start")}>
                   <div className={cn(
                     "flex gap-3 max-w-[85%] md:max-w-[75%]",
                     msg.role === "user" ? "flex-row-reverse" : "flex-row"
                   )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ring-1 ring-border/50",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                      )}>
                        {msg.role === "user" ? <User className="w-5 h-5" /> : <Shield className="w-5 h-5 text-primary" />}
                      </div>
                      <div className={cn(
                        "rounded-xl p-4 text-sm whitespace-pre-wrap shadow-sm",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"
                      )}>
                        {msg.content}
                      </div>
                   </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0 border shadow-sm">
                       <Shield className="w-5 h-5 animate-pulse text-primary" />
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex items-center gap-2 shadow-sm">
                       <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
                    </div>
                 </div>
              )}
           </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center gap-2">
                 {models.length > 0 ? (
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-[200px] h-8 text-xs bg-muted/50 border-transparent hover:bg-muted transition-colors focus:ring-0">
                           <div className="flex items-center gap-2">
                               <Shield className="w-3 h-3" />
                               <SelectValue placeholder="Select Model" />
                           </div>
                        </SelectTrigger>
                        <SelectContent>
                           {models.map(m => (
                             <SelectItem key={m.id} value={m.id} className="text-xs">
                                {m.name}
                             </SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                 ) : (
                    <div className="text-xs text-destructive flex items-center gap-2 px-2 py-1 bg-destructive/10 rounded-md">
                        <Shield className="w-3 h-3" />
                        No models installed
                    </div>
                 )}
              </div>
              
              <div className="flex gap-3 relative">
                 <Textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Message Fortress..."
                    className="min-h-[50px] max-h-[200px] bg-card resize-none pr-12 py-3 shadow-sm focus-visible:ring-1"
                    disabled={isLoading}
                 />
                 <Button 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim() || !selectedModel}
                    size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8 transition-all hover:scale-105"
                 >
                   <Send className="w-4 h-4" />
                 </Button>
              </div>
              <div className="text-[10px] text-center text-muted-foreground/60">
                 AI can make mistakes. Please verify important information.
              </div>
           </div>
        </div>
      </div>

      <Dialog open={!!editingChat} onOpenChange={(open) => !open && setEditingChat(null)}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Rename Conversation</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <Label>Title</Label>
               <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-2" />
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setEditingChat(null)}>Cancel</Button>
               <Button onClick={handleRenameChat}>Save</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;
