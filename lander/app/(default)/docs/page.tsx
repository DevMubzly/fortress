
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - Fortress",
  description: "Comprehensive guide to deploying and managing Fortress.",
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Documentation
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome to the Fortress documentation. Learn how to deploy, configure, and manage your sovereign AI infrastructure.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Introduction
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Fortress is an enterprise-grade AI platform designed for regulated environments. Unlike public cloud solutions, Fortress runs entirely within your infrastructure, ensuring complete data sovereignty and compliance with strict regulatory frameworks.
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Key capabilities include:
        </p>
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li><strong>Data Sovereignty:</strong> All data remains within your controlled environment.</li>
          <li><strong>Local Model Execution:</strong> Run LLMs locally on your own hardware or private cloud.</li>
          <li><strong>Audit & Compliance:</strong> Comprehensive logging of all interactions and model outputs.</li>
          <li><strong>Enterprise Security:</strong> SSO integration, RBAC, and end-to-end encryption.</li>
        </ul>
      </div>

      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Getting Started
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          To begin using Fortress, you'll need to deploy the platform to your server infrastructure. Check the{' '}
          <Link href="/docs/installation" className="font-medium text-primary underline underline-offset-4">
            Installation Guide
          </Link>{' '}
          for detailed instructions on setting up Docker containers and connecting your local LLM inference engines (e.g., Ollama).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/docs/architecture" className="group rounded-lg border p-6 transition-colors hover:bg-muted/50">
          <h3 className="mb-2 font-semibold group-hover:underline">Architecture Overview &rarr;</h3>
          <p className="text-sm text-muted-foreground">Understanding the components of Fortress and how they interact.</p>
        </Link>
        <Link href="/docs/api" className="group rounded-lg border p-6 transition-colors hover:bg-muted/50">
          <h3 className="mb-2 font-semibold group-hover:underline">API Reference &rarr;</h3>
          <p className="text-sm text-muted-foreground">Integrate Fortress with your existing internal tools.</p>
        </Link>
      </div>
    </div>
  );
}
