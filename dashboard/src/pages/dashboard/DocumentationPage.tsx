import { BookOpen, MessageSquare, Key, Shield, Settings, Server, Users, FileText, ExternalLink, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { usePermissions } from "@/lib/permissions";

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  articles: string[];
  adminOnly?: boolean;
}

const allDocSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Quick start guides and basics",
    icon: BookOpen,
    articles: ["Installation Guide", "First Steps", "Basic Configuration"],
  },
  {
    id: "ai-chat",
    title: "AI Chat",
    description: "Using the chat interface",
    icon: MessageSquare,
    articles: ["Chat Basics", "Model Selection", "Conversation History", "Prompt Tips"],
  },
  {
    id: "prompts",
    title: "Prompt Library",
    description: "Creating and managing prompts",
    icon: FileText,
    articles: ["Creating Templates", "Variables & Placeholders", "Sharing Prompts"],
  },
  {
    id: "api-keys",
    title: "API Key Management",
    description: "Creating and managing API keys",
    icon: Key,
    articles: ["Creating Keys", "Model Binding", "Token Limits", "Revoking Keys"],
    adminOnly: true,
  },
  {
    id: "authentication",
    title: "Authentication & SSO",
    description: "Setting up single sign-on",
    icon: Shield,
    articles: ["OIDC Configuration", "SAML Setup", "Role Mapping", "Group Sync"],
    adminOnly: true,
  },
  {
    id: "security",
    title: "Security & Compliance",
    description: "Security best practices",
    icon: Shield,
    articles: ["Audit Logging", "Data Encryption", "Access Control", "Compliance Reports"],
    adminOnly: true,
  },
  {
    id: "licensing",
    title: "Licensing",
    description: "Managing your license",
    icon: Key,
    articles: ["License Types", "Uploading Licenses", "Feature Entitlements", "Renewals"],
    adminOnly: true,
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    description: "Server and system setup",
    icon: Server,
    articles: ["Ollama Configuration", "Vector Database Setup", "Scaling", "Backup & Recovery"],
    adminOnly: true,
  },
  {
    id: "user-management",
    title: "User Management",
    description: "Managing users and roles",
    icon: Users,
    articles: ["Creating Users", "Role Assignment", "Permissions Matrix", "Bulk Import"],
    adminOnly: true,
  },
  {
    id: "advanced",
    title: "Advanced Configuration",
    description: "Advanced settings and tuning",
    icon: Settings,
    articles: ["Rate Limiting", "Custom Models", "API Webhooks", "Performance Tuning"],
    adminOnly: true,
  },
];

const DocumentationPage = () => {
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sections based on role
  const visibleSections = permissions.isStaffOnly 
    ? allDocSections.filter(section => !section.adminOnly)
    : allDocSections;

  // Filter by search
  const filteredSections = visibleSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.articles.some(article => article.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documentation</h2>
          <p className="text-sm text-muted-foreground">
            {permissions.isStaffOnly ? "Guides for using Fortress AI" : "Complete guides and reference documentation"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search documentation..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section) => (
          <Card key={section.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                {section.title}
                {section.adminOnly && (
                  <Badge variant="outline" className="text-[10px] ml-auto">Admin</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {section.articles.map((article) => (
                  <li key={article} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <ExternalLink className="w-3 h-3" />
                    {article}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documentation found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default DocumentationPage;
