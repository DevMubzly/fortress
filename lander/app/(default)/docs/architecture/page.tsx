import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Architecture - Fortress AI Documentation",
  description: "Understanding the technical architecture of the Fortress AI platform.",
};

export default function ArchitecturePage() {
  const toc = [
    { id: "overview", title: "Overview" },
    { id: "core-components", title: "Core Components" },
    { id: "data-flow", title: "Data Flow" },
    { id: "infrastructure", title: "Infrastructure Requirements" },
  ];

  return (
    <DocsPage 
      title="Architecture" 
      description="Deep dive into the Fortress AI system design."
      toc={toc}
    >
      <h2 id="overview" className="scroll-mt-24">Overview</h2>
      <p>
        Fortress AI follows a modular, microservices-based architecture designed for air-gapped and private cloud environments. All components are containerized and can be orchestrated via Docker Compose or Kubernetes.
      </p>

      <h2 id="core-components" className="scroll-mt-24">Core Components</h2>
      <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
        <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Inference Engine</h3>
          <p className="text-muted-foreground text-sm">
             The brain of the operation. Supports Ollama and vLLM for running open-weights models like Llama 3, Mistral, and Gemma efficiently on consumer or enterprise hardware.
          </p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Backend API</h3>
          <p className="text-muted-foreground text-sm">
            High-performance FastAPI service handling request routing, context management, RAG pipelines, and authentication.
          </p>
        </div>
        <div className="p-6 border rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Vector Database</h3>
          <p className="text-muted-foreground text-sm">
            PostgreSQL with pgvector or Qdrant for storing embeddings, enabling semantic search and long-term memory for the AI.
          </p>
        </div>
         <div className="p-6 border rounded-xl bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-slate-900 dark:to-slate-800">
          <h3 className="font-semibold text-lg mb-2">Frontend Dashboard</h3>
          <p className="text-muted-foreground text-sm">
            A modern React application for chat interfaces, prompt engineering, and system administration.
          </p>
        </div>
      </div>

      <h2 id="data-flow" className="scroll-mt-24">Data Flow</h2>
      <p>
        When a user sends a prompt, the request flows through the following stages:
      </p>
      <ol>
        <li><strong>Authentication:</strong> The API Gateway validates the JWT token.</li>
        <li><strong>Retrieval (RAG):</strong> If attached documents are present, the system queries the Vector DB for relevant context.</li>
        <li><strong>Prompt Assembly:</strong> User query and retrieved context are combined into a system prompt.</li>
        <li><strong>Inference:</strong> The prompt is sent to the Inference Engine (e.g., vLLM).</li>
        <li><strong>Streaming:</strong> Tokens are streamed back to the frontend in real-time via Server-Sent Events (SSE).</li>
      </ol>

      <h2 id="infrastructure" className="scroll-mt-24">Infrastructure Requirements</h2>
      <p>
        Fortress is optimized for NVIDIA GPUs but can run on CPU-only clusters for smaller models.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Minimum:</strong> 16GB RAM, 4 vCPUs (for 7B quantization models)</li>
        <li><strong>Recommended:</strong> NVIDIA T4 or A10G GPU, 32GB RAM</li>
        <li><strong>Storage:</strong> 100GB NVMe SSD (for model weights and vector indices)</li>
      </ul>
    </DocsPage>
  );
}
