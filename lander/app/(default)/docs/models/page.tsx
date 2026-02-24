import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Models - Fortress AI Documentation",
  description: "Learn about the AI models supported by Fortress and how they are orchestrated.",
};

export default function ModelsPage() {
  const toc = [
    { id: "overview", title: "Overview" },
    { id: "supported-models", title: "Supported Models" },
    { id: "inference-providers", title: "Inference Providers" },
    { id: "use-cases", title: "Use Cases" },
    { id: "configuration", title: "Configuration" },
  ];

  return (
    <DocsPage title="AI Models" description="Core intelligence engines powering Fortress." toc={toc}>
      <h2 id="overview" className="scroll-mt-24">Overview</h2>
      <p>
        Fortress integrates with state-of-the-art open-weights models to provide secure, on-premise intelligence without data leaving your infrastructure. By default, it supports Llama 3, Mistral, and specialized coding models like CodeLlama.
      </p>

      <h2 id="supported-models" className="scroll-mt-24">Supported Models</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Llama 3 (8B/70B)</strong>: General purpose reasoning, summarization, and creative writing. best-in-class for open models.</li>
        <li><strong>Mistral Large</strong>: High performance reasoning with efficient context handling.</li>
        <li><strong>CodeLlama / StarCoder</strong>: Specialized for code generation, refactoring, and explanation tasks.</li>
        <li><strong>Phi-3</strong>: Lightweight model optimized for low-latency responses on standard hardware.</li>
      </ul>

      <h2 id="inference-providers" className="scroll-mt-24">Inference Providers</h2>
      <p>
        Fortress abstracts the underlying inference engine, allowing you to switch between providers based on your hardware capabilities:
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-semibold mb-2">Ollama (Default)</h3>
          <p className="text-sm text-muted-foreground">Easiest setup. Runs as a background service. Optimized for consumer GPUS (NVIDIA/AMD) and Apple Silicon.</p>
        </div>
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-semibold mb-2">vLLM</h3>
          <p className="text-sm text-muted-foreground">High-throughput production engine. Recommended for enterprise deployments handling concurrent requests.</p>
        </div>
      </div>

      <h2 id="use-cases" className="scroll-mt-24">Use Cases</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Retrieval Augmented Generation (RAG)</h3>
          <p>
            Models are connected to your internal vector database to provide answers grounded in your company's documents, policies, and codebases.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Secure Code Assistant</h3>
          <p>
            Developers can use the VS Code extension or web interface to generate boilerplate, write tests, and document code without exposing IP to public APIs.
          </p>
        </div>
      </div>

      <h2 id="configuration" className="scroll-mt-24">Configuration</h2>
      <p>
        Models can be configured via the <code>/admin/models</code> dashboard. You can pull new models from HuggingFace or Ollama library directly:
      </p>
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
<code>{`# Example CLI command to pull a new model
ollama pull llama3:70b-instruct
`}</code>
      </pre>
    </DocsPage>
  );
}
