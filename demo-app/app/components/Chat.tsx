"use client";

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
    api: '/api/chat',
    headers: {
        'Authorization': `Bearer sk-fortress-${process.env.NEXT_PUBLIC_FORTRESS_API_KEY || 'demo-key'}`
    }
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-persis">Fortress AI Demo</h1>
        <p className="text-sm text-gray-500">
           Powered by Fortress API Key: <code className="bg-gray-100 p-1 rounded">sk-fortress-...{process.env.NEXT_PUBLIC_FORTRESS_API_KEY?.slice(-4) || 'demo'}</code>
        </p>
      </div>

      {messages.length > 0 ? (
        messages.map(m => (
          <div key={m.id} className={`mb-4 whitespace-pre-wrap ${m.role === 'user' ? 'text-blue-600 text-right' : 'text-gray-800 text-left'}`}>
            <span className="font-bold">{m.role === 'user' ? 'User: ' : 'AI: '}</span>
            {m.content}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 py-10">
            Start a conversation to test your API integration.
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">
            Error: {error.message}. Check if your Fortress API Key is active.
        </div>
      )}

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md p-2 bg-white border-t mb-8">
        <input
          className="w-full p-2 border border-gray-300 rounded shadow-xl focus:outline-blue-500"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
