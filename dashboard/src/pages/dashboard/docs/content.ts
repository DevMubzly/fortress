
import { 
  Server, 
  Shield, 
  Users, 
  MessageSquare, 
  Database, 
  Key, 
  Activity, 
  FileText,
  Terminal,
  Cpu
} from "lucide-react";

export interface DocItem {
  id: string;
  title: string;
  category: string;
  icon?: React.ElementType;
  content: string; // We'll use simple markdown-like or HTML string, or a component
}

export const docCategories = [
  "Platform Overview",
  "User Guide",
  "Administration",
  "Developer Resources"
];

export const docsContent: DocItem[] = [
  // Platform Overview
  {
    id: "introduction",
    title: "Introduction to Fortress",
    category: "Platform Overview",
    icon: Shield,
    content: `
      ## Welcome to Fortress AI

      Fortress AI is a secure, enterprise-grade AI workspace designed for organizations that require complete data sovereignty and privacy. Unlike public AI services, Fortress runs entirely within your infrastructure, ensuring that sensitive data never leaves your environment.

      ### Key Features
      
      - **Private AI Models**: Run open-source LLMs (like Llama 3, Mistral, Gemma) locally on your hardware.
      - **End-to-End Encryption**: All data, including chat history and documents, is encrypted at rest and in transit.
      - **Role-Based Access Control (RBAC)**: Granular permissions for administrators and standard users.
      - **Audit Logging**: Comprehensive logs of all system activities for compliance and security auditing.
      - **Personal RAG**: Upload and chat with your own documents securely.
    `
  },
  {
    id: "architecture",
    title: "System Architecture",
    category: "Platform Overview",
    icon: Server,
    content: `
      ## System Architecture

      Fortress is built on a modern, scalable stack designed for performance and security.

      ### Components

      1. **Frontend Dashboard**: 
         - Built with React, TypeScript, and Tailwind CSS.
         - Provides a responsive interface for chat, management, and monitoring.
      
      2. **Backend API**:
         - Powered by Python FastAPI.
         - Handles authentication, business logic, and orchestration of AI services.
         - Uses SQLite for lightweight, portable data storage (with support for Postgres).

      3. **AI Inference Engine**:
         - Integrates with Ollama for efficient local LLM inference.
         - Supports GPU acceleration (NVIDIA CUDA) for high-performance token generation.

      4. **Vector Database**:
         - Uses ChromaDB for semantic search and RAG (Retrieval-Augmented Generation) capabilities.
         - Stores document embeddings locally.
    `
  },

  // User Guide
  {
    id: "chat-interface",
    title: "Using the Chat Interface",
    category: "User Guide",
    icon: MessageSquare,
    content: `
      ## Chat Interface

      The Chat Interface is your primary workspace for interacting with AI models.

      ### Validating Responses
      Always verify AI-generated code or critical information. While capable, models can hallucinate.

      ### Switching Models
      Use the model selector in the top-right corner to switch between installed models (e.g., Llama3 vs Mistral) depending on your task requirements (speed vs reasoning).

      ### Context Window
      The chat history is limited by the model's context window. If a conversation becomes too long, start a new chat to maintain performance.
    `
  },
  {
    id: "prompt-library",
    title: "Prompt Engineering",
    category: "User Guide",
    icon: Terminal,
    content: `
      ## Prompt Library

      The Prompt Library allows you to save and reuse effective system prompts.

      ### Creating Templates
      1. Navigate to **Prompt Library**.
      2. Click **New Prompt**.
      3. Define variables using {{variable_name}} syntax.
      
      ### Best Practices
      - Be specific about the persona (e.g., "You are a senior Python engineer").
      - Provide examples of desired output format.
      - Use positive constraints (what to do) over negative ones (what not to do).
    `
  },
  {
    id: "personal-rag",
    title: "Document Analysis (RAG)",
    category: "User Guide",
    icon: FileText,
    content: `
      ## Personal Documents

      Fortress allows you to upload documents (PDF, TXT, MD) to create a personal knowledge base.

      ### How it Works
      1. **Upload**: Navigate to **My Documents** and upload your files.
      2. **Indexing**: The system processes the text and creates vector embeddings.
      3. **Query**: In the chat, enable "Context" or select your document collection to ask questions specifically about your files.

      ### Privacy Note
      Uploaded documents are processed locally. No data is sent to third-party APIs.
    `
  },

  // Administration
  {
    id: "user-management",
    title: "User Management",
    category: "Administration",
    icon: Users,
    content: `
      ## User Management

      Administrators have full control over user access and roles.

      ### Creating Users
      - Navigate to **Identity & Access**.
      - Click **Add User**.
      - Assign a role:
        - **Admin**: Full system access.
        - **Staff**: Access to chat and personal workspace only.

      ### Revoking Access
      You can deactivate or delete users instantly. Active sessions will be invalidated immediately.
    `
  },
  {
    id: "model-management",
    title: "Model Management",
    category: "Administration",
    icon: Cpu,
    content: `
      ## Model Hub

      The Model Hub allows you to download and manage open-source LLMs.

      ### Installing Models
      1. Go to **Model Hub**.
      2. Select a model family (e.g., Llama 3).
      3. Choose the quantization level (e.g., 4-bit, 8-bit).
      4. Click **Download**.

      ### Resource Monitoring
      Keep an eye on **System Health** to ensure your server has enough VRAM/RAM to run the selected models.
    `
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    category: "Administration",
    icon: Activity,
    content: `
      ## Audit Logs

      Fortress maintains an immutable log of critical system actions for compliance.

      ### Tracked Events
      - User Logins/Logouts
      - API Key Generation/Revocation
      - User Creation/Deletion
      - System Configuration Changes
      - Model Downloads

      ### Exporting
      Logs can be exported to CSV or JSON for external analysis in SIEM tools.
    `
  },
  {
    id: "api-keys",
    title: "API Keys",
    category: "Administration",
    icon: Key,
    content: `
      ## API Key Management

      Fortress provides programmatic access via API keys.

      ### Usage
      - Keys are scoped to the user who created them.
      - Use keys to integrate Fortress AI capabilities into internal tools or workflows.
      
      ### Security
      - Keys are only displayed once upon creation.
      - Store keys securely (e.g., in a secrets manager).
      - Revoke compromised keys immediately.
    `
  },

  // Developer Resources
  {
    id: "api-reference",
    title: "API Reference",
    category: "Developer Resources",
    icon: Database,
    content: `
      ## API Reference

      The Fortress API follows RESTful principles.

      ### Base URL
      \`http://your-instance:5500/api/v1\`

      ### Authentication
      Include the API key in the Authorization header:
      \`Authorization: Bearer <your-api-key>\`

      ### Common Endpoints
      - \`POST /chat/completions\`: OpenAI-compatible chat completion endpoint.
      - \`GET /models\`: List available models.
      - \`POST /embeddings\`: Generate vector embeddings for text.
    `
  }
];
