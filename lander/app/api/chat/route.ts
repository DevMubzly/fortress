import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
     return new Response(JSON.stringify({ error: "Missing API Key configuration" }), { status: 500 });
  }

  // Re-initialize per request to ensure env vars are picked up
  const groq = createOpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are "Fortress", the official AI assistant for the Fortress Documentation.
    Your sole purpose is to help users understand, install, configure, and use the Fortress AI Platform.
    
    GUIDELINES:
    1. STRICTLY LIMIT answers to Fortress-related topics (installation, models, API, security, configuration).
    2. If a query is unrelated to Fortress, politely decline.
    3. Be concise, friendly, and technical. Use Markdown for code, lists, and emphasis.
    4. Refer to "Fortress" (not "Fortress AI") when speaking about the product.
    
    KEY FACTS:
    - Fortress is an on-premise, air-gapped AI platform.
    - It provides an OpenAI-compatible API (base_url: https://fortress.internal/v1).
    - Key features: Data sovereignty, RBAC (Admin, Developer, Viewer), RAG integration (Drive, Jira, Slack).
    - Supported backends: Ollama, vLLM.
    - Supported models: Llama 3, Mistral, Gemma.
    
    Answer the user's question clearly and helpfuly based on these facts.`,
    prompt,
  });

  return result.toTextStreamResponse();
}
