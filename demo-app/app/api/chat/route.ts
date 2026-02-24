import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// In a real scenario, this would point to the Fortress Proxy/Gateway
// For now, we simulate the behavior but we MUST have the key from the dashboard.
// The user prompt implies we are building a demo that USES a key issued by Fortress.

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer sk-fortress-')) {
    return new Response('Unauthorized: Missing or Invalid Fortress API Key', { status: 401 });
  }

  // Monitor usage (Mock implementation)
  console.log(`[Fortress Analytics] API Key Usage: ${authHeader.split(' ')[1]} | Timestamp: ${new Date().toISOString()}`);

  // We are "simulating" the Fortress Backend here. 
  // Normally this would be: baseURL: 'https://fortress.internal/v1'
  // But since we don't have the fortress backend running, we can fallback to groq 
  // IF we had a real key, or just mock the response for the demo.
  
  // However, the instructions say "chatbot that will need an api key integration issued from fortress dashboard".
  // Let's assume the Demo App is a CLIENT of Fortress.
  
  const fortress = createOpenAI({
     apiKey: process.env.GROQ_API_KEY || 'demo', // This would be the "Model Provider" key, hidden from the client.
     baseURL: 'https://api.groq.com/openai/v1',
  });

  const result = streamText({
    model: fortress('llama-3.3-70b-versatile'),
    system: 'You are a helpful assistant powered by Fortress AI.',
    messages,
  });

  return result.toTextStreamResponse();
}
