// LangChain integration utility for dashboard chat
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function runLangChainChat(messages, model, apiKey) {
  // Convert messages to LangChain format
  const lcMessages = messages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  // Call backend API for inference
  const res = await fetch("http://localhost:8000/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("fortress_token")}`,
      "X-Fortress-Key": apiKey || ""
    },
    body: JSON.stringify({
      model,
      messages: lcMessages.map(m => ({ role: m._getType(), content: m.text })),
    })
  });
  if (!res.ok) throw new Error("Model inference failed");
  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.result || "";
}
