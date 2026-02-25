import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Force dynamic - this is Next.js App Router
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API Key configuration" }), { status: 500 });
    }

    const model = new ChatOpenAI({
      apiKey: apiKey,
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      streaming: true,
    });

    const systemContent = `You are "Fortress", the official AI assistant for the Fortress Documentation.
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
    
    Answer the user's question clearly and helpfuly based on these facts.`;

    const langchainMessages = [
      new SystemMessage(systemContent),
      ...messages.map((m: any) => {
        if (m.role === 'user') return new HumanMessage(m.content);
        if (m.role === 'assistant') return new AIMessage(m.content);
        return new HumanMessage(m.content);
      })
    ];

    const parser = new StringOutputParser();
    const stream = await model.pipe(parser).stream(langchainMessages);

    const encoder = new TextEncoder();
    
    // Convert AsyncGenerator to ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
