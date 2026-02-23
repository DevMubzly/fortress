import { useState } from "react";
import { Search, Download, Filter, FileJson, FileSpreadsheet, FileText, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/lib/permissions";
import { toast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  timestamp: string;
  apiKey: string;
  apiKeyMasked: string;
  ipAddress: string;
  userAgent: string;
  agentId: string;
  agentName: string;
  action: 'prompt' | 'completion' | 'error' | 'auth' | 'config';
  promptSample: string;
  resultSample: string;
  tokensUsed: number;
  latencyMs: number;
  status: 'success' | 'error' | 'blocked';
}

const mockLogs: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2024-03-10 14:32:15',
    apiKey: 'sk-legal-abc123def456ghi789',
    apiKeyMasked: 'sk-legal-****-789',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    agentId: 'agent-001',
    agentName: 'Legal Document Analyzer',
    action: 'prompt',
    promptSample: 'Summarize the key clauses in this NDA regarding ******* and *******...',
    resultSample: 'The NDA contains the following key clauses: 1. Confidentiality period of **** years...',
    tokensUsed: 1250,
    latencyMs: 2340,
    status: 'success',
  },
  {
    id: 'log-002',
    timestamp: '2024-03-10 14:28:03',
    apiKey: 'sk-hr-xyz789abc123def456',
    apiKeyMasked: 'sk-hr-****-456',
    ipAddress: '192.168.1.87',
    userAgent: 'PostmanRuntime/7.32.3',
    agentId: 'agent-002',
    agentName: 'HR Policy Assistant',
    action: 'prompt',
    promptSample: 'What is the policy for remote work approval for ******* level employees?',
    resultSample: 'According to policy HR-2024-015, remote work approval requires...',
    tokensUsed: 890,
    latencyMs: 1850,
    status: 'success',
  },
  {
    id: 'log-003',
    timestamp: '2024-03-10 14:15:42',
    apiKey: 'sk-invalid-key',
    apiKeyMasked: 'sk-invalid-****',
    ipAddress: '45.33.32.156',
    userAgent: 'curl/7.84.0',
    agentId: 'agent-001',
    agentName: 'Legal Document Analyzer',
    action: 'auth',
    promptSample: '[Authentication attempt blocked]',
    resultSample: '[Access denied - invalid credentials]',
    tokensUsed: 0,
    latencyMs: 12,
    status: 'blocked',
  },
  {
    id: 'log-004',
    timestamp: '2024-03-10 13:58:20',
    apiKey: 'sk-eng-mno456pqr789',
    apiKeyMasked: 'sk-eng-****-789',
    ipAddress: '192.168.1.92',
    userAgent: 'Python-Requests/2.28.1',
    agentId: 'agent-003',
    agentName: 'Code Review Bot',
    action: 'error',
    promptSample: 'Review this Python code for security vulnerabilities: import os; os.system(*****)...',
    resultSample: '[Error: Model inference timeout after 30s]',
    tokensUsed: 0,
    latencyMs: 30000,
    status: 'error',
  },
  {
    id: 'log-005',
    timestamp: '2024-03-10 13:45:10',
    apiKey: 'sk-admin-sys001',
    apiKeyMasked: 'sk-admin-****-001',
    ipAddress: '192.168.1.1',
    userAgent: 'AdminConsole/1.0',
    agentId: 'system',
    agentName: 'System',
    action: 'config',
    promptSample: '[Configuration change: Model llama3.1:70b set as default]',
    resultSample: '[Configuration updated successfully]',
    tokensUsed: 0,
    latencyMs: 45,
    status: 'success',
  },
  {
    id: 'log-006',
    timestamp: '2024-03-10 13:30:00',
    apiKey: 'sk-fin-mno456pqr789stu012',
    apiKeyMasked: 'sk-fin-****-012',
    ipAddress: '192.168.1.78',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    agentId: 'agent-004',
    agentName: 'Financial Report Generator',
    action: 'prompt',
    promptSample: 'Generate Q4 2023 financial summary with key metrics...',
    resultSample: 'Q4 2023 Financial Summary: Revenue increased by 12%...',
    tokensUsed: 2340,
    latencyMs: 4200,
    status: 'success',
  },
];

const AuditLogsPage = () => {
  const permissions = usePermissions();
  const [logs] = useState<AuditLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.apiKeyMasked.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.promptSample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesAction && matchesStatus;
  });

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${filteredLogs.length} logs as ${format.toUpperCase()}...`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-[10px]">Error</Badge>;
      case 'blocked':
        return <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">Blocked</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      prompt: 'bg-primary/20 text-primary border-primary/30',
      completion: 'bg-success/20 text-success border-success/30',
      error: 'bg-destructive/20 text-destructive border-destructive/30',
      auth: 'bg-warning/20 text-warning border-warning/30',
      config: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge className={`${colors[action] || 'bg-muted'} text-[10px]`}>{action}</Badge>;
  };

  if (!permissions.canAccessAuditLogs) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md text-center p-6">
          <p className="text-muted-foreground">
            You don't have permission to access audit logs. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Audit Logs</h2>
          <p className="text-sm text-muted-foreground">High-speed searchable activity logs with export functionality</p>
        </div>
        {permissions.canExportAuditLogs && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Plain Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-muted/20">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by API key, agent, IP address, or prompt content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[130px] h-9 bg-background">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="prompt">Prompt</SelectItem>
            <SelectItem value="completion">Completion</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="config">Config</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground">
          {filteredLogs.length} entries
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg overflow-hidden border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[140px] font-semibold">Timestamp</TableHead>
              <TableHead className="font-semibold">API Key</TableHead>
              <TableHead className="font-semibold">Request Origin</TableHead>
              <TableHead className="font-semibold">Agent</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="max-w-[180px] font-semibold">Prompt</TableHead>
              <TableHead className="max-w-[180px] font-semibold">Result</TableHead>
              <TableHead className="font-semibold">Tokens</TableHead>
              <TableHead className="font-semibold">Latency</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/20">
                <TableCell className="font-mono text-[10px] text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell>
                  <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                    {log.apiKeyMasked}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px]">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Monitor className="w-3 h-3" />
                      <span className="truncate max-w-[120px]" title={log.userAgent}>
                        {log.userAgent.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-xs">{log.agentName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{log.agentId}</p>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="text-[10px] text-muted-foreground truncate" title={log.promptSample}>
                    {log.promptSample}
                  </p>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="text-[10px] text-muted-foreground truncate" title={log.resultSample}>
                    {log.resultSample}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-[10px]">{log.tokensUsed.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-[10px]">{log.latencyMs}ms</TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
