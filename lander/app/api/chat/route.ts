import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Groq via OpenAI compatibility
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-to-prevent-crash', // Ideally should use a real key.
  baseURL: 'https://api.groq.com/openai/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
     return new Response(JSON.stringify({ error: "Missing API Key configuration" }), { status: 500 });
  }
  const { prompt } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are the official AI assistant for the Fortress AI Platform (fortress.internal). 
    STRICT RULE: You must ONLY answer questions related to Fortress AI, its features, architecture, and documentation.
    If the user asks about anything else (e.g., general knowledge, coding help unrelated to Fortress, weather, etc.), politely refuse and state that you can only assist with Fortress AI.
    
    Fortress Context:
    - On-premise AI platform, air-gapped support.
    - Full data sovereignty, no data egress.
    - OpenAI-compatible API (base_url: https://fortress.internal/v1).
    - RBAC: Admin, Developer, Viewer roles.
    - Supported Models: Llama 3, Mistral, Gemma (via Ollama/vLLM).
    - Integration: Google Drive, Confluence, Jira, Slack (RAG).
    
    Be concise, technical, and accurate.`,
    prompt,
  });

  return result.toTextStreamResponse();
}
