import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Groq via OpenAI compatibility
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
  compatibility: 'strict', // recommended for 3rd party providers
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are a helpful assistant for Fortress AI documentation. 
    Fortress is a secure, on-premise AI platform.
    Key features: 
    - Full data sovereignty (no data leaves your network)
    - OpenAI-compatible API
    - Role-Based Access Control (RBAC)
    - Audit Logging
    - Supports Llama 3, Mistral, Gemma models (pulled via Ollama)
    
    Answer the user's question based on this context. Be concise and friendly.`,
    prompt,
  });

  return result.toDataStreamResponse();
}
