from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from backend.models.models import User, ChatRequest
from backend.dependencies import deps
from backend.database import get_db_connection
import aiohttp
import json
import uuid
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])
OLLAMA_BASE_URL = "http://localhost:11434"

def save_message(conversation_id: str, role: str, content: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    msg_id = f"msg_{uuid.uuid4().hex}"
    cursor.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, conversation_id, role, content, datetime.utcnow())
    )
    conn.commit()
    conn.close()

def update_conversation(conversation_id: str, title: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if title:
        cursor.execute("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?", (title, datetime.utcnow(), conversation_id))
    else:
        cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (datetime.utcnow(), conversation_id))
    conn.commit()
    conn.close()

@router.post("/completions")
async def chat_completions(req: ChatRequest, conversation_id: str = None, current_user: User = Depends(deps.get_current_user)):
    # 1. Create or Get Conversation
    conv_id = conversation_id or req.conversation_id
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if not conv_id:
        conv_id = f"conv_{uuid.uuid4().hex[:8]}"
        title = req.messages[0]['content'][:30] if req.messages else "New Chat"
        cursor.execute(
            "INSERT INTO conversations (id, user_id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (conv_id, current_user.id, title, req.model, datetime.utcnow(), datetime.utcnow())
        )
        conn.commit()
    else:
        cursor.execute("SELECT * FROM conversations WHERE id = ? AND user_id = ?", (conv_id, current_user.id))
        if not cursor.fetchone():
             raise HTTPException(status_code=404, detail="Conversation not found")
        update_conversation(conv_id)
    
    conn.close()

    # 2. Save User Message
    last_msg = req.messages[-1]
    if last_msg['role'] == 'user':
        save_message(conv_id, 'user', last_msg['content'])

    # 3. Stream from Ollama
    async def generate():
        full_response = ""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{OLLAMA_BASE_URL}/api/chat", json={
                    "model": req.model,
                    "messages": req.messages,
                    "stream": True
                }) as resp:
                    async for line in resp.content:
                        if line:
                            try:
                                data = json.loads(line)
                                if "message" in data:
                                    content = data["message"]["content"]
                                    full_response += content
                                    yield json.dumps({"id": conv_id, "content": content}) + "\n"
                                if data.get("done"):
                                    break
                            except:
                                pass
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"
        
        # 4. Save Assistant Message (after stream)
        if full_response:
            save_message(conv_id, 'assistant', full_response)

    return StreamingResponse(generate(), media_type="application/x-ndjson")

@router.get("/history")
async def list_history(current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC", (current_user.id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, current_user.id))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conversation_id,))
    msgs = cursor.fetchall()
    conn.close()
    
    return {"conversation": dict(conv), "messages": [dict(m) for m in msgs]}

@router.delete("/history/{conversation_id}")
async def delete_history(conversation_id: str, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, current_user.id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")
    conn.commit()
    conn.close()
    return {"status": "deleted"}
