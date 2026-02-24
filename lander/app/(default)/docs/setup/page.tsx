import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "Setup Guide - Fortress AI",
  description: "Step-by-step instructions for deploying Fortress on your infrastructure.",
};

export default function SetupPage() {
  const toc = [
    { id: "prerequisites", title: "Prerequisites" },
    { id: "docker", title: "Docker Deployment" },
    { id: "configuration", title: "Configuration" },
    { id: "verification", title: "Verification" },
  ];

  return (
    <DocsPage 
      title="Setup Guide" 
      description="Deploying Fortress on your local machine or private cloud."
      toc={toc}
    >
      <h2 id="prerequisites" className="scroll-mt-24">Prerequisites</h2>
      <p>Before installing Fortress, ensure you have the following:</p>
      <ul>
        <li><strong>RAM</strong>: 16GB minimum (32GB+ recommended for 70B models).</li>
        <li><strong>GPU</strong>: NVIDIA GPU with at least 8GB VRAM (CUDA support). Mac M1/M2/M3 also supported.</li>
        <li><strong>OS</strong>: Linux (Ubuntu 22.04+), macOS, or Windows (WSL2).</li>
        <li><strong>Docker</strong>: Docker Desktop or Engine with GPU support.</li>
      </ul>

      <h2 id="docker" className="scroll-mt-24">Docker Deployment</h2>
      <p>The quickest way to get started is using our Docker Compose stack.</p>

      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4"><code>{`git clone https://github.com/fortress-stack/fortress
cd fortress
docker compose up -d`}</code></pre>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
        <p className="font-semibold text-yellow-800 dark:text-yellow-200">Wait for Model Pull</p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">The first run may take 5-10 minutes as it downloads the base Llama 3 model (4.7GB).</p>
      </div>

      <h2 id="configuration" className="scroll-mt-24">Configuration</h2>
      <p>
        Environment variables are managed in the <code>.env</code> file. Customize ports, secrets, and database settings here.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Connecting Local Directories</h3>
      <p>
        To enable RAG on your local files, mount the <code>/data</code> volume:
      </p>
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto"><code>{`volumes:
  - ./my-docs:/app/backend/data/docs`}</code></pre>

      <h2 id="verification" className="scroll-mt-24">Verification</h2>
      <p>
        Once deployed, visit <a href="http://localhost:3000" target="_blank">http://localhost:3000</a> to access the dashboard.
        <br />
        Default admin credentials: <code>admin / fortress123</code> (Please change immediately).
      </p>
    </DocsPage>
  );
}
