from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import aiohttp
import asyncio
import json
import logging
from datetime import datetime

from starlette.websockets import WebSocketDisconnect
from backend.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/models", tags=["models"])

# Adjust if your Ollama runs elsewhere or in Docker
OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL

# -----------------------------------------------------------------------------
# Global Download Manager
# -----------------------------------------------------------------------------
class DownloadManager:
    def __init__(self):
        self.active_downloads: Dict[str, Dict] = {}
        self.clients: List[WebSocket] = []
        self._tasks: Dict[str, asyncio.Task] = {}

    async def broadcast_status(self):
        if not self.clients:
            return
            
        data = {
            "type": "status_update",
            "downloads": self.active_downloads
        }
        
        to_remove = []
        for client in self.clients:
            try:
                await client.send_json(data)
            except:
                to_remove.append(client)
        
        for client in to_remove:
            self.clients.remove(client)

    async def start_pull(self, model_id: str):
        # Check if already downloading (active and not paused)
        if model_id in self.active_downloads:
            current = self.active_downloads[model_id]
            if current['status'] != 'Paused' and current['status'] != 'Error' and current['status'] != 'Stopped':
                 return
            
            # If resuming, keep success/total values?
            # Ollama will figure it out, but UI needs reset to "Starting" or keep as is?
            # Let's update status to resuming
            current['status'] = "Resuming..."
            current['isPaused'] = False
        else:
            # Initialize new download
            self.active_downloads[model_id] = {
                "modelId": model_id,
                "status": "Starting...",
                "progress": 0,
                "total": 0,
                "completed": 0,
                "isPaused": False
            }
        
        await self.broadcast_status()

        # Start background task
        # Cancel existing if any (zombie task?)
        if model_id in self._tasks:
            self._tasks[model_id].cancel()

        task = asyncio.create_task(self._pull_worker(model_id))
        self._tasks[model_id] = task

    async def _pull_worker(self, model_id: str):
        model_name = model_id
        if ":" not in model_name:
            model_name = f"{model_name}:latest"

        try:
            async with aiohttp.ClientSession() as session:
                payload = {"name": model_name, "stream": True}
                async with session.post(f"{OLLAMA_BASE_URL}/api/pull", json=payload) as resp:
                    if resp.status != 200:
                        self.active_downloads[model_id]['status'] = f"Error: {resp.status}"
                        await self.broadcast_status()
                        return

                    buffer = ""
                    async for chunk in resp.content.iter_any():
                        if model_id not in self.active_downloads:
                            # Download cancelled/stopped (removed from dict)
                            return 
                        
                        if self.active_downloads[model_id].get('isPaused'):
                            return

                        if chunk:
                            buffer += chunk.decode('utf-8')
                            while "\n" in buffer:
                                line, buffer = buffer.split("\n", 1)
                                if not line.strip(): continue
                                
                                try:
                                    data = json.loads(line)
                                    status = data.get("status")
                                    
                                    # Update internal state
                                    current = self.active_downloads[model_id]
                                    current['status'] = status
                                    
                                    if data.get('total') and data.get('completed'):
                                        current['total'] = data.get('total')
                                        current['completed'] = data.get('completed')
                                        if data['total'] > 0:
                                            current['progress'] = round((data['completed'] / data['total']) * 100)
                                    
                                    if status == 'success':
                                        current['progress'] = 100
                                        current['status'] = 'completed'
                                        await self.broadcast_status()
                                        
                                        # Keep completed state briefly then remove? 
                                        # Or keep it until client acknowledges?
                                        # For persistent view, we might want to keep it until user dismisses.
                                        # For now, let's keep it in "completed" state.
                                        # Frontend can choose to hide or show "Done".
                                        return

                                    await self.broadcast_status()
                                    
                                except json.JSONDecodeError:
                                    pass
        except Exception as e:
            logger.error(f"Pull worker error: {e}")
            msg = str(e)
            if "Connect call failed" in msg or "Connection refused" in msg or "10061" in msg or "Cannot connect to host" in msg:
                 msg = "Ollama Unreachable. Is it running?"
            
            if model_id in self.active_downloads:
                self.active_downloads[model_id]['status'] = f"Error: {msg}"
                await self.broadcast_status()

    def pause_pull(self, model_id: str):
        if model_id in self._tasks:
            self._tasks[model_id].cancel()
            del self._tasks[model_id]
        
        if model_id in self.active_downloads:
            self.active_downloads[model_id]['isPaused'] = True
            self.active_downloads[model_id]['status'] = 'Paused'
            # Need async loop for broadcast, use create_task
            asyncio.create_task(self.broadcast_status())

    def stop_pull(self, model_id: str):
        if model_id in self._tasks:
            self._tasks[model_id].cancel()
            del self._tasks[model_id]
        
        # Keep it in active_downloads so UI knows it was cancelled/stopped?
        # Or remove it entirely?
        # User says "stopping is not working". Maybe they expect it to just STOP and disappear?
        # If we remove it, the next broadcast sends downloads WITHOUT this ID.
        # Frontend sees it missing -> removes from state.
        if model_id in self.active_downloads:
            del self.active_downloads[model_id]
        
        # Broadcast immediately
        asyncio.create_task(self.broadcast_status())

manager = DownloadManager()

# -----------------------------------------------------------------------------
# Curated Models for Discovery (Static JSON DB)
# -----------------------------------------------------------------------------
CURATED_MODELS = [
    {
        "id": "llama3.1",
        "name": "Llama 3.1",
        "provider": "Meta",
        "versions": ["8b", "70b"],
        "description": "Meta's latest open model. Excellent reasoning and coding capabilities. The 8B version is perfect for consumer hardware.",
        "tags": ["reasoning", "coding", "general"],
        "pull_count": "10M+", 
        "size_range": "4.7GB",
        "default_tag": "latest"
    },
    {
        "id": "gemma2",
        "name": "Gemma 2",
        "provider": "Google",
        "versions": ["2b", "9b", "27b"],
        "description": "Google's latest open model family. High performance and efficiency. 9B is a sweet spot for 16GB RAM.",
        "tags": ["lightweight", "google", "general"],
        "pull_count": "5M+",
        "size_range": "1.6GB - 5.5GB",
        "default_tag": "9b"
    },
    {
        "id": "qwen2.5",
        "name": "Qwen 2.5",
        "provider": "Alibaba Cloud",
        "versions": ["7b", "14b", "32b"],
        "description": "State-of-the-art performance in coding and mathematics. Often outperforms larger models.",
        "tags": ["coding", "math", "multilingual"],
        "pull_count": "2M+",
        "size_range": "4.5GB - 9GB",
        "default_tag": "7b"
    },
    {
        "id": "mistral",
        "name": "Mistral (v0.3)",
        "provider": "Mistral AI",
        "versions": ["7b"],
        "description": "The 7B model that redefined open weights. Very balanced and efficient.",
        "tags": ["fast", "versatile", "7b"],
        "pull_count": "15M+",
        "size_range": "4.1GB",
        "default_tag": "latest"
    },
    {
        "id": "phi3.5",
        "name": "Phi-3.5",
        "provider": "Microsoft",
        "versions": ["mini", "medium"],
        "description": "Microsoft's small language model with high reasoning capabilities. Perfect for local RAG.",
        "tags": ["microsoft", "small", "reasoning"],
        "pull_count": "2M+",
        "size_range": "2.2GB",
        "default_tag": "latest"
    },
    {
        "id": "codellama",
        "name": "Code Llama",
        "provider": "Meta",
        "versions": ["7b", "13b"],
        "description": "Specialized for code generation and debugging. Supports many languages.",
        "tags": ["coding", "python", "cpp"],
        "pull_count": "6M+",
        "size_range": "3.8GB - 7GB",
        "default_tag": "latest"
    },
    {
        "id": "deepseek-coder",
        "name": "DeepSeek Coder",
        "provider": "DeepSeek",
        "versions": ["6.7b"],
        "description": "Highly capable coding model with strong performance on benchmarks.",
        "tags": ["coding", "developer"],
        "pull_count": "1M+",
        "size_range": "4GB",
        "default_tag": "6.7b"
    },
    {
        "id": "llava",
        "name": "LLaVA",
        "provider": "Various",
        "versions": ["7b", "13b"],
        "description": "Large Language-and-Vision Assistant. Can describe images.",
        "tags": ["vision", "multimodal", "images"],
        "pull_count": "3M+",
        "size_range": "4GB - 8GB",
        "default_tag": "latest"
    },
    {
        "id": "yi",
        "name": "Yi",
        "provider": "01.AI",
        "versions": ["6b", "9b"],
        "description": "Strong bilingual (English/Chinese) performance and large context window.",
        "tags": ["bilingual", "context"],
        "pull_count": "500K+",
        "size_range": "4GB - 6GB",
        "default_tag": "latest"
    },
    {
        "id": "solar",
        "name": "Solar",
        "provider": "Upstage",
        "versions": ["10.7b"],
        "description": "10.7B parameter model with excellent performance, derived from Llama 2.",
        "tags": ["performance", "10b"],
        "pull_count": "500K+",
        "size_range": "6GB",
        "default_tag": "latest"
    },
    {
        "id": "openchat",
        "name": "OpenChat",
        "provider": "OpenChat",
        "versions": ["7b"],
        "description": "Fine-tuned on a high-quality dataset. Behaviors like ChatGPT.",
        "tags": ["chat", "alignment"],
        "pull_count": "1M+",
        "size_range": "4.2GB",
        "default_tag": "latest"
    },
    {
        "id": "tinyllama",
        "name": "TinyLlama",
        "provider": "Various",
        "versions": ["1.1b"],
        "description": "Extremely small and fast. Good for specific edge tasks or quick testing.",
        "tags": ["tiny", "fast", "edge"],
        "pull_count": "5M+",
        "size_range": "630MB",
        "default_tag": "latest"
    }
]

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get("")
async def get_all_models():
    """
    Returns discovered models + installed models merged.
    """
    installed = []
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_BASE_URL}/api/tags") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    installed = data.get("models", [])
                else:
                    logger.error(f"Ollama tags failed: {resp.status}")
    except Exception as e:
        # Avoid spamming logs for connection errors if Ollama is down
        if "Cannot connect to host" not in str(e):
             logger.error(f"Ollama connection failed: {e}")
        
    discovery_list = []
    
    # Process Curated Models into a flat list for the UI
    for m in CURATED_MODELS:
        # Check against installed to update status
        is_installed = any(inst['name'].startswith(m['id']) for inst in installed)
        
        discovery_list.append({
            "id": m["id"],
            "name": m["name"],
            "provider": m["provider"],
            "size": m["size_range"],
            "parameter_count": m["versions"][-1].upper(), # approximate
            "quantization": "Unknown",
            "status": "installed" if is_installed else "available",
            "description": m["description"],
            "tags": m["tags"],
            "download_progress": 0 if not is_installed else 100
        })

    # Also include installed models that might differ from our curated list
    final_list = list(discovery_list)
    installed_names_in_curated = [c['id'] for c in CURATED_MODELS]
    
    for inst in installed:
        base_name = inst['name'].split(':')[0]
        if base_name not in installed_names_in_curated:
            final_list.append({
                "id": inst['name'],
                "name": inst['name'],
                "provider": "Local / Custom",
                "size": f"{round(inst['size'] / (1024**3), 2)} GB",
                "parameter_count": "Unknown",
                "quantization": inst.get('details', {}).get('quantization_level', 'Unknown'),
                "status": "installed",
                "description": "Locally installed model via Ollama",
                "tags": ["local", "installed"],
                "download_progress": 100
            })

    return final_list

@router.delete("/{model_id}")
async def delete_model(model_id: str):
    try:
        async with aiohttp.ClientSession() as session:
            payload = {"name": model_id}
            async with session.delete(f"{OLLAMA_BASE_URL}/api/delete_model", json=payload) as resp:
                if resp.status == 404:
                     async with session.delete(f"{OLLAMA_BASE_URL}/api/delete", json=payload) as resp2:
                        if resp2.status == 200:
                             return {"status": "deleted", "id": model_id}
                        else:
                            text = await resp2.text()
                            raise HTTPException(status_code=resp2.status, detail=text)
                elif resp.status == 200:
                     return {"status": "deleted", "id": model_id}
                else: 
                     async with session.post(f"{OLLAMA_BASE_URL}/api/delete", json=payload) as resp3:
                        if resp3.status == 200:
                             return {"status": "deleted", "id": model_id}
                        raise HTTPException(status_code=500, detail="Could not delete model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ModelLoadRequest(BaseModel):
    model: str

@router.post("/load")
async def load_model(req: ModelLoadRequest):
    try:
        if ":" not in req.model:
            req.model = f"{req.model}:latest"

        async with aiohttp.ClientSession() as session:
            payload = {
                "model": req.model,
                "prompt": "", 
                "keep_alive": "5m" 
            }
            async with session.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload) as resp:
                if resp.status == 200:
                    return {"status": "loaded", "model": req.model}
                else:
                    raise HTTPException(status_code=resp.status, detail="Failed to load model in Ollama")
    except Exception as e:
        logger.error(f"Load error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------------------------
# WebSocket for Global Download Status
# -----------------------------------------------------------------------------
@router.websocket("/downloads")
async def websocket_downloads(websocket: WebSocket):
    await websocket.accept()
    manager.clients.append(websocket)
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "status_update",
            "downloads": manager.active_downloads
        })
        
        while True:
            try:
                # Wait for commands from client
                data = await websocket.receive_json()
                action = data.get("action")
                model_id = data.get("modelId")
                
                if action == "start":
                    await manager.start_pull(model_id)
                elif action == "pause":
                    manager.pause_pull(model_id)
                elif action == "stop":
                    manager.stop_pull(model_id)
                elif action == "resume":
                    await manager.start_pull(model_id)
            except WebSocketDisconnect:
                break
            except Exception:
                break
                
    except Exception as e:
        logger.error(f"WS Error: {e}")
    finally:
        if websocket in manager.clients:
            manager.clients.remove(websocket)
