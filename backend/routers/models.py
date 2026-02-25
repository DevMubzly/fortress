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

from backend.database import get_db_connection

# -----------------------------------------------------------------------------
# Global Download Manager
# -----------------------------------------------------------------------------
class DownloadManager:
    def __init__(self):
        self.active_downloads: Dict[str, Dict] = {}
        self.clients: List[WebSocket] = []
        self._tasks: Dict[str, asyncio.Task] = {}
        self._init_from_db()

    def _init_from_db(self):
        """Restore state from DB on startup"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM downloaded_models")
            rows = cursor.fetchall()
            conn.close()
            
            for row in rows:
                if row['status'] == 'downloading':
                    # If it was downloading when server stopped, mark as interrupted
                    self._update_db_status(row['model_id'], 'error', error_message="Download interrupted by server restart")
                elif row['status'] == 'installed':
                     # We don't keep installed models in memory active_downloads, 
                     # but we can query them for the list endpoint.
                     pass
        except Exception as e:
            logger.error(f"Failed to init models from DB: {e}")

    def _update_db_status(self, model_id, status, progress=0, error_message=None, size_mb=0):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Upsert
            cursor.execute("""
                INSERT INTO downloaded_models (model_id, status, progress, error_message, installed_at, size_mb)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(model_id) DO UPDATE SET
                    status=excluded.status,
                    progress=excluded.progress,
                    error_message=excluded.error_message,
                    installed_at=excluded.installed_at,
                    size_mb=excluded.size_mb
            """, (
                model_id, 
                status, 
                progress, 
                error_message, 
                datetime.utcnow().isoformat() if status == 'installed' else None,
                size_mb
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"DB Update failed: {e}")

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
            if current['status'] not in ['Paused', 'Error', 'Stopped']:
                 return
            
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
        
        self._update_db_status(model_id, 'downloading', 0)
        await self.broadcast_status()

        if model_id in self._tasks:
            self._tasks[model_id].cancel()

        task = asyncio.create_task(self._pull_worker(model_id))
        self._tasks[model_id] = task

    async def _pull_worker(self, model_id: str):
        model_name = model_id
        if ":" not in model_name:
            model_name = f"{model_name}:latest"

        try:
            timeout = aiohttp.ClientTimeout(total=None) # No timeout for large files
            async with aiohttp.ClientSession(timeout=timeout) as session:
                payload = {"name": model_name, "stream": True}
                async with session.post(f"{OLLAMA_BASE_URL}/api/pull", json=payload) as resp:
                    if resp.status != 200:
                        msg = f"Error: {resp.status}"
                        self.active_downloads[model_id]['status'] = msg
                        self._update_db_status(model_id, 'error', error_message=msg)
                        await self.broadcast_status()
                        return

                    buffer = ""
                    async for chunk in resp.content.iter_any():
                        if model_id not in self.active_downloads:
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
                                    
                                    current = self.active_downloads[model_id]
                                    current['status'] = status
                                    
                                    progress = 0
                                    total_mb = 0
                                    
                                    if data.get('total') and data.get('completed'):
                                        current['total'] = data.get('total')
                                        current['completed'] = data.get('completed')
                                        if data['total'] > 0:
                                            progress = round((data['completed'] / data['total']) * 100)
                                            current['progress'] = progress
                                            total_mb = round(data['total'] / (1024*1024), 2)
                                    
                                    if status == 'success':
                                        current['progress'] = 100
                                        current['status'] = 'completed'
                                        self._update_db_status(model_id, 'installed', 100, size_mb=total_mb)
                                        await self.broadcast_status()
                                        return

                                    # Only update DB periodically or on status change?
                                    # For now, simplistic approach
                                    # self._update_db_status(model_id, 'downloading', progress) 
                                    await self.broadcast_status()
                                    
                                except json.JSONDecodeError:
                                    pass
        except Exception as e:
            logger.error(f"Pull worker error: {e}")
            msg = str(e)
            if "Connect call failed" in msg or "Connection refused" in msg:
                 msg = "Ollama Unreachable"
            
            if model_id in self.active_downloads:
                self.active_downloads[model_id]['status'] = f"Error: {msg}"
                self._update_db_status(model_id, 'error', error_message=msg)
                await self.broadcast_status()

    def pause_pull(self, model_id: str):
        if model_id in self._tasks:
            self._tasks[model_id].cancel()
            del self._tasks[model_id]
        
        if model_id in self.active_downloads:
            self.active_downloads[model_id]['isPaused'] = True
            self.active_downloads[model_id]['status'] = 'Paused'
            self._update_db_status(model_id, 'paused', self.active_downloads[model_id].get('progress', 0))
            asyncio.create_task(self.broadcast_status())

    def stop_pull(self, model_id: str):
        if model_id in self._tasks:
            self._tasks[model_id].cancel()
            del self._tasks[model_id]
        
        if model_id in self.active_downloads:
            del self.active_downloads[model_id]
            # Remove from DB? or mark as stopped?
            # Remove from DB if cancelled completely
            try:
                conn = get_db_connection()
                conn.execute("DELETE FROM downloaded_models WHERE model_id = ?", (model_id,))
                conn.commit()
                conn.close()
            except:
                pass
        
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
async def list_models():
    """
    Returns curated models with status merged from DB/Ollama
    """
    try:
        # 1. Get real installed models from Ollama (source of truth for running)
        installed = []
        try:
            timeout = aiohttp.ClientTimeout(total=2.0)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{OLLAMA_BASE_URL}/api/tags") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        installed = data.get("models", [])
        except:
            pass

        # Normalize installed names
        installed_map = {}
        for m in installed:
            name = m['name']
            if ':' not in name: name += ":latest"
            installed_map[name] = m
            # Also map short name if unique?
            short = name.split(':')[0]
            if short not in installed_map: installed_map[short] = m

        # 2. Get DB status
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM downloaded_models")
            db_models = {row['model_id']: dict(row) for row in cursor.fetchall()}
            conn.close()
        except:
            db_models = {}

        results = []
        
        # 3. Process Curated List
        for m in CURATED_MODELS:
            model_id = m['id']
            full_id = f"{model_id}:latest" # normalization assumption
            
            # Default state
            status = 'available'
            progress = 0
            size = m.get('size_range', 'Unknown')
            
            # Check Active Memory (most recent)
            if model_id in manager.active_downloads:
                status = 'downloading'
                progress = manager.active_downloads[model_id].get('progress', 0)
                if manager.active_downloads[model_id]['status'].startswith('Error'):
                     status = 'error'
            
            # Check DB (persistence)
            elif model_id in db_models:
                row = db_models[model_id]
                db_stat = row['status']
                if db_stat == 'installed':
                     status = 'installed'
                     # Use DB size if available
                     if row['size_mb']: size = f"{row['size_mb']} MB"
                elif db_stat == 'downloading':
                     status = 'downloading'
                     progress = row['progress']
                elif db_stat == 'error':
                     status = 'error'

            # Check Ollama Real State (Ultimate Truth for Installed)
            if model_id in installed_map or full_id in installed_map:
                status = 'installed'
                # Update size from real
                real_m = installed_map.get(model_id) or installed_map.get(full_id)
                if real_m:
                    bytes_size = real_m.get('size', 0)
                    if bytes_size > 1024**3:
                        size = f"{round(bytes_size / (1024**3), 2)} GB"
                    else:
                        size = f"{round(bytes_size / (1024**2), 0)} MB"

            results.append({
                "id": model_id,
                "name": m["name"],
                "provider": m["provider"],
                "size": size,
                "parameter_count": m["versions"][-1].upper(), 
                "quantization": "4-bit (Default)", # simplified
                "status": status,
                "description": m["description"],
                "tags": m["tags"],
                "download_progress": progress
            })

        # 4. Add unknown installed models
        curated_ids = [c['id'] for c in CURATED_MODELS]
        for name, data in installed_map.items():
            base = name.split(':')[0]
            if base in curated_ids or name in curated_ids:
                continue
            
            # Verify we haven't added it yet (due to multiple mappings)
            if any(r['id'] == name for r in results): continue

            bytes_size = data.get('size', 0)
            size_str = f"{round(bytes_size / (1024**3), 2)} GB"

            results.append({
                "id": name,
                "name": name,
                "provider": "Local",
                "size": size_str,
                "parameter_count": "?",
                "quantization": data.get('details', {}).get('quantization_level', '?'),
                "status": "installed",
                "description": "Locally installed model",
                "tags": ["local"],
                "download_progress": 100
            })

        return results
    except Exception as e:
        logger.error(f"List models error: {e}")
        # Fallback to curated only
        return [{
            "id": m["id"],
            "name": m["name"],
            "provider": m["provider"],
            "size": m["size_range"],
            "parameter_count": "Unknown",
            "quantization": "Unknown",
            "status": "available",
            "description": m["description"],
            "tags": m["tags"],
            "download_progress": 0
        } for m in CURATED_MODELS]


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
            try:
                async with session.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload) as resp:
                    if resp.status == 200:
                        return {"status": "loaded", "model": req.model}
                    else:
                        raise HTTPException(status_code=resp.status, detail="Failed to load model in Ollama")
            except aiohttp.ClientConnectorError:
                raise HTTPException(status_code=503, detail="Ollama service unreachable")
    except HTTPException:
        raise
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
