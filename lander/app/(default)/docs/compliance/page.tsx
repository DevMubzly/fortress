import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Audit & Compliance - Fortress AI Documentation",
  description: "Ensuring regulatory compliance with Fortress AI.",
};

export default function CompliancePage() {
  const toc = [
    { id: "audit-logs", title: "Comprehensive Audit Logs" },
    { id: "data-retention", title: "Data Retention Policies" },
    { id: "compliance-frameworks", title: "Supported Frameworks" },
    { id: "export-capabilities", title: "Export Capabilities" },
  ];

  return (
    <DocsPage 
      title="Audit & Compliance" 
      description="Track every interaction and ensure your AI usage meets regulatory standards."
      toc={toc}
    >
      <h2 id="audit-logs" className="scroll-mt-24">Comprehensive Audit Logs</h2>
      <p>
        Visibility is crucial for security. Fortress logs every interaction with the AI system.
      </p>

      <div className="space-y-4 my-8 not-prose">
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex items-start gap-4">
          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
          <div>
            <h3 className="font-medium text-sm text-foreground">Prompt Logging</h3>
            <p className="text-muted-foreground text-xs mt-1">Full-text capture of user prompts and system outputs (configurable).</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex items-start gap-4">
          <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
          <div>
            <h3 className="font-medium text-sm text-foreground">Metadata Tracking</h3>
            <p className="text-muted-foreground text-xs mt-1">Capture User ID, IP address, timestamp, token count, and model used.</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex items-start gap-4">
          <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
          <div>
            <h3 className="font-medium text-sm text-foreground">System Events</h3>
            <p className="text-muted-foreground text-xs mt-1">Log configuration changes, user logins, and API key modifications.</p>
          </div>
        </div>
      </div>

      <h2 id="data-retention" className="scroll-mt-24">Data Retention Policies</h2>
      <p>
        Define how long data is stored within Fortress. You can configure:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Chat History:</strong> Automatically delete conversations older than X days.</li>
        <li><strong>Audit Logs:</strong> Archive logs to S3-compatible storage for long-term retention.</li>
        <li><strong>Vector Index:</strong> Manage the lifecycle of embedded documents.</li>
      </ul>

      <h2 id="compliance-frameworks" className="scroll-mt-24">Supported Frameworks</h2>
      <p>
        Fortress is built to help organizations meet the following standards:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 font-semibold text-center text-sm not-prose">
        <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900">SOC 2 Type II</div>
        <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900">HIPAA</div>
        <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900">GDPR</div>
        <div className="p-3 border rounded bg-slate-50 dark:bg-slate-900">CCPA</div>
      </div>

      <h2 id="export-capabilities" className="scroll-mt-24">Export Capabilities</h2>
      <p>
        Need to share audit trails with compliance officers? Fortress allows you to export logs in CSV, JSON, or PDF formats directly from the dashboard.
      </p>
    </DocsPage>
  );
}
