import { DocsPage } from "@/components/docs/DocsPage";
import Image from "next/image";

export const metadata = {
  title: "Introduction - Fortress AI Documentation",
  description: "Introduction to Fortress AI, the secure on-premise AI platform.",
};

export default function IntroPage() {
  const toc = [
    { id: "what-is-fortress", title: "What is Fortress AI?" },
    { id: "key-features", title: "Key Features" },
    { id: "architecture-overview", title: "Architecture Overview" },
    { id: "getting-started", title: "Getting Started" },
  ];

  return (
    <DocsPage 
      title="Introduction" 
      description="Secure, private, and powerful AI for your enterprise."
      toc={toc}
    >
      <h2 id="what-is-fortress" className="scroll-mt-24">What is Fortress AI?</h2>
      <p>
        Fortress AI is an enterprise-grade AI platform designed to run entirely within your secure perimeter. It provides the capabilities of modern LLMs (Large Language Models) like ChatGPT or Claude, but without sending a single byte of data to external cloud providers.
      </p>
      <p>
        Built for organizations with strict compliance requirements, Fortress offers full data sovereignty, audit logging, and role-based access control out of the box.
      </p>

      <h2 id="key-features" className="scroll-mt-24">Key Features</h2>
      <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
        <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Private by Design</h3>
          <p className="text-muted-foreground text-sm">Deploy on-premise or in your private cloud (VPC). No data egress.</p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">RAG integration</h3>
          <p className="text-muted-foreground text-sm">Connect directly to Google Drive, Confluence, Jira, and Slack.</p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">SSO & RBAC</h3>
          <p className="text-muted-foreground text-sm">Enterprise authentication with Okta, Azure AD, and granular permissions.</p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Code Assistant</h3>
          <p className="text-muted-foreground text-sm">VS Code extension for secure pair programming.</p>
        </div>
      </div>

      <h2 id="architecture-overview" className="scroll-mt-24">Architecture Overview</h2>
      <p>
        Fortress is composed of three main layers:
      </p>
      <ul>
        <li><strong>Inference Engine</strong>: Orchestrates model execution (Ollama/vLLM).</li>
        <li><strong>Backend API (FastAPI)</strong>: Handles request routing, authentication, and RAG pipelines.</li>
        <li><strong>Frontend (React)</strong>: Provides the chat interface, admin dashboard, and analytics.</li>
      </ul>

      <h2 id="getting-started" className="scroll-mt-24">Getting Started</h2>
      <p>
        Ready to deploy? Proceed to the <a href="/docs/setup">setup guide</a> to install Fortress in your environment.
      </p>
    </DocsPage>
  );
}
