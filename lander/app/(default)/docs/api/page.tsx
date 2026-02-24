import { DocsPage } from "@/components/docs/DocsPage";

export const metadata = {
  title: "API Reference - Fortress AI Documentation",
  description: "Integrate fortress into your applications using our OpenAI-compatible API.",
};

export default function ApiPage() {
  const toc = [
    { id: "authentication", title: "Authentication" },
    { id: "completions", title: "Chat Completions" },
    { id: "embeddings", title: "Embeddings" },
    { id: "models", title: "List Models" },
  ];

  return (
    <DocsPage 
      title="API Reference" 
      description="Build powerful AI features with a familiar interface."
      toc={toc}
    >
        <p className="text-lg">
            Fortress provides an API that is fully compatible with the OpenAI SDK. Simply change the <code>baseURL</code> to your Fortress instance.
        </p>

      <h2 id="authentication" className="scroll-mt-24">Authentication</h2>
      <p>
        All API requests must include your API key in the <code>Authorization</code> header.
      </p>
      <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto not-prose my-4">
        <pre className="text-sm"><code>Authorization: Bearer sk-fortress-...</code></pre>
      </div>

      <h2 id="completions" className="scroll-mt-24">Chat Completions</h2>
      <p>
        Generates a model response for the given chat conversation.
      </p>
      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md border not-prose my-4 space-y-2">
        <div className="flex gap-2 font-mono text-sm">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 rounded">POST</span>
            <span>/v1/chat/completions</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">Request Body</h3>
       <div className="overflow-x-auto rounded-lg border not-prose mb-6">
        <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
                <tr>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Field</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Type</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b">
                     <td className="p-4 align-middle font-mono">model</td>
                     <td className="p-4 align-middle text-muted-foreground">string</td>
                     <td className="p-4 align-middle">ID of the model to use (e.g., <code>llama3</code>).</td>
                </tr>
                 <tr className="border-b">
                     <td className="p-4 align-middle font-mono">messages</td>
                     <td className="p-4 align-middle text-muted-foreground">array</td>
                     <td className="p-4 align-middle">A list of messages comprising the conversation so far.</td>
                </tr>
                <tr className="border-b">
                     <td className="p-4 align-middle font-mono">stream</td>
                     <td className="p-4 align-middle text-muted-foreground">boolean</td>
                     <td className="p-4 align-middle">Whether to stream back partial progress. Defaults to false.</td>
                </tr>
            </tbody>
        </table>
       </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">Example (Python)</h3>
      <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto not-prose my-4">
<pre className="text-sm"><code>{`from openai import OpenAI

client = OpenAI(
    base_url="https://fortress.internal/v1",
    api_key="sk-fortress-..."
)

response = client.chat.completions.create(
    model="llama3",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is data sovereignty?"}
    ]
)

print(response.choices[0].message.content)`}</code></pre>
      </div>


      <h2 id="embeddings" className="scroll-mt-24">Embeddings</h2>
      <p>
        Get a vector representation of a given input that can be easily consumed by machine learning models and algorithms.
      </p>
       <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md border not-prose my-4 space-y-2">
        <div className="flex gap-2 font-mono text-sm">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 rounded">POST</span>
            <span>/v1/embeddings</span>
        </div>
      </div>
      
       <h2 id="models" className="scroll-mt-24">List Models</h2>
      <p>
        Lists the currently available models, and provides basic information about each one such as the owner and availability.
      </p>
       <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md border not-prose my-4 space-y-2">
        <div className="flex gap-2 font-mono text-sm">
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 rounded">GET</span>
            <span>/v1/models</span>
        </div>
      </div>

    </DocsPage>
  );
}
