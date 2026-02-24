
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installation - Fortress Docs",
};

export default function InstallationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Installation
      </h1>
      
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Fortress is distributed as a set of Docker containers. Ensure you have Docker and Docker Compose (or a compatible orchestrator) installed on your target machine.
      </p>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Prerequisites
      </h2>
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li><strong>OS:</strong> Linux (Ubuntu 22.04 recommended) or Windows with WSL2.</li>
        <li><strong>CPU:</strong> 4 cores minimum recommended.</li>
        <li><strong>RAM:</strong> 16GB minimum (32GB+ for running 7B+ parameter models locally).</li>
        <li><strong>Storage:</strong> 50GB SSD space.</li>
        <li><strong>Docker:</strong> Version 24.0+.</li>
      </ul>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Deployment Steps
      </h2>
      
      <div className="space-y-4">
        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">1. Clone the Repository</h3>
        <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
          <code>git clone https://github.com/fortress-ai/fortress.git</code>
        </pre>

        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">2. Configuration</h3>
        <p className="leading-7">
          Copy the example environment file and update the settings.
        </p>
        <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
          <code>cp .env.example .env</code>
        </pre>

        <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">3. Start Services</h3>
        <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
          <code>docker-compose up -d</code>
        </pre>
      </div>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
        Connecting Models
      </h2>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Fortress integrates with Ollama by default for local inference. Ensure Ollama is running on port 11434 and accessible to the Fortress backend container.
      </p>
    </div>
  );
}
