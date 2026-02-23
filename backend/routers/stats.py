from fastapi import APIRouter, Depends, Query, HTTPException
from backend.database import get_db_connection
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import sqlite3
import random

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/overview")
async def get_overview_stats(range: str = Query("all")):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    time_filter = "1=1" 
    if range == "24h":
        time_filter = "created_at >= datetime('now', '-24 hours')"
    elif range == "7d":
        time_filter = "created_at >= datetime('now', '-7 days')"
    elif range == "30d":
        time_filter = "created_at >= datetime('now', '-30 days')"
    
    # 1. Total Token Usage
    cursor.execute(f"SELECT SUM(total_tokens) FROM request_logs WHERE {time_filter}")
    res_tokens = cursor.fetchone()[0]
    total_tokens = res_tokens if res_tokens else 0

    # 2. Avg Latency
    cursor.execute(f"SELECT AVG(latency_ms) FROM request_logs WHERE latency_ms IS NOT NULL AND {time_filter}")
    res_lat = cursor.fetchone()[0]
    avg_latency = float(res_lat) if res_lat else 0

    # 3. Error Rate
    cursor.execute(f"SELECT COUNT(*) FROM request_logs WHERE {time_filter}")
    total_requests = cursor.fetchone()[0] or 0
    
    cursor.execute(f"SELECT COUNT(*) FROM request_logs WHERE status_code != 200 AND {time_filter}")
    total_errors = cursor.fetchone()[0] or 0
    
    error_rate = 0
    if total_requests > 0:
        error_rate = (total_errors / total_requests) * 100

    conn.close()
    
    return {
        "total_tokens": total_tokens,
        "avg_latency": round(avg_latency, 2),
        "error_rate": round(error_rate, 2),
        "total_requests": total_requests
    }

@router.get("/activity")
async def get_activity_stats(range: str = Query("24h")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row  # Ensure dict-like access
    cursor = conn.cursor()
    
    time_filter = "'-24 hours'"
    group_format = "'%Y-%m-%d %H:00:00'"
    label_format = "'%H:00'"
    
    if range == "7d":
        time_filter = "'-7 days'"
        group_format = "'%Y-%m-%d'"
        label_format = "'%m-%d'"
    elif range == "30d":
        time_filter = "'-30 days'"
        group_format = "'%Y-%m-%d'"
        label_format = "'%m-%d'"
        
    query = f"""
        SELECT 
            strftime({group_format}, created_at) as time_bucket,
            strftime({label_format}, created_at) as label,
            COUNT(*) as requests,
            SUM(total_tokens) as tokens
        FROM request_logs
        WHERE created_at >= datetime('now', {time_filter})
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    data = []
    for r in rows:
        data.append({
            "name": r["label"],
            "requests": r["requests"],
            "tokens": r["tokens"] or 0
        })
        
    return data

@router.get("/top-keys")
async def get_top_keys_stats(range: str = Query("7d")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    time_filter = "'-7 days'"
    if range == "24h":
        time_filter = "'-24 hours'"
    elif range == "30d":
        time_filter = "'-30 days'"
    
    # 1. Identify Top 3 Keys by usage in selected range
    query = f"""
        SELECT 
            k.name,
            k.id,
            SUM(r.total_tokens) as total_tokens
        FROM request_logs r
        JOIN api_keys k ON r.key_id = k.id
        WHERE r.created_at >= datetime('now', {time_filter})
        GROUP BY k.id
        ORDER BY total_tokens DESC
        LIMIT 3
    """
    cursor.execute(query)
    top_rows = cursor.fetchall()
    
    top_keys = [{"id": r["id"], "name": r["name"]} for r in top_rows]
    
    if not top_keys:
        conn.close()
        return []

    # 2. Get daily usage for these keys over last 7 days
    # We construct a parameterized query for the IN clause
    placeholders = ",".join("?" * len(top_keys))
    key_ids = [k["id"] for k in top_keys]
    
    daily_query = f"""
        SELECT 
            strftime('%Y-%m-%d', created_at) as day,
            key_id,
            SUM(total_tokens) as tokens
        FROM request_logs
        WHERE key_id IN ({placeholders}) 
          AND created_at >= datetime('now', '-7 days')
        GROUP BY day, key_id
        ORDER BY day ASC
    """
    
    cursor.execute(daily_query, key_ids)
    daily_rows = cursor.fetchall()
    conn.close()
    
    # 3. Pivot Logic
    # We want a list of days, each containing values for key1, key2, key3
    
    # First, initialize map of all last 7 days to 0 values
    data_map: Dict[str, Dict[str, Any]] = {} 
    today = datetime.now()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_str = d.strftime("%Y-%m-%d")
        day_name = d.strftime("%a") # Mon, Tue
        data_map[day_str] = {"name": day_name, "date": day_str, "key1": 0, "key2": 0, "key3": 0}

    # Fill data
    for row in daily_rows:
        day_str = row["day"]
        if day_str in data_map:
            # Find which key rank this is (1, 2, or 3)
            key_rank = -1
            for idx, k in enumerate(top_keys):
                if k["id"] == row["key_id"]:
                    key_rank = idx + 1
                    break
            
            if key_rank != -1:
                data_map[day_str][f"key{key_rank}"] = row["tokens"]

    return list(data_map.values())

@router.get("/logs")
async def get_logs(
    limit: int = 50, 
    offset: int = 0, 
    model: Optional[str] = None,
    status: Optional[str] = None, # 'success', 'error', 'all'
    search: Optional[str] = None,
    range: str = Query("all")
):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # We construct the WHERE clause dynamically
    conditions = []
    params = []

    # Filter by Time Range
    if range == "24h":
         conditions.append("r.created_at >= datetime('now', '-24 hours')")
    elif range == "7d":
         conditions.append("r.created_at >= datetime('now', '-7 days')")
    elif range == "30d":
         conditions.append("r.created_at >= datetime('now', '-30 days')")

    if model and model != "all":
        conditions.append("r.model = ?")
        params.append(model)
        
    if status and status != "all":
        if status == 'error':
            conditions.append("r.status_code != 200")
        elif status == 'success':
            conditions.append("r.status_code = 200")

    # Search Logic (Key Name, IP, Model)
    if search:
        # Note: We need JOIN for k.name
        conditions.append("(k.name LIKE ? OR r.ip_address LIKE ? OR r.model LIKE ?)")
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    where_clause = ""
    if conditions:
        where_clause = " WHERE " + " AND ".join(conditions)

    # Base Query with Joins
    base_query = f"""
        SELECT r.*, k.name as key_name, u.username 
        FROM request_logs r
        LEFT JOIN api_keys k ON r.key_id = k.id
        LEFT JOIN users u ON r.user_id = u.id
        {where_clause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    """
    
    # Execute Main Query
    query_params = params + [limit, offset]
    cursor.execute(base_query, query_params)
    rows = cursor.fetchall()
    
    # Count Query for Pagination
    count_query = f"""
        SELECT COUNT(*) 
        FROM request_logs r 
        LEFT JOIN api_keys k ON r.key_id = k.id 
        {where_clause}
    """
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0] or 0

    conn.close()
    
    return {
        "data": [dict(row) for row in rows],
        "total": total_count,
        "page": (offset // limit) + 1,
        "limit": limit
    }

@router.post("/seed")
async def seed_data():
    """Generates dummy data for demonstration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get some keys
    cursor.execute("SELECT id FROM api_keys")
    keys = [r[0] for r in cursor.fetchall()]
    
    if not keys:
        # Create a dummy key if none exist
        cursor.execute("INSERT INTO api_keys (name, prefix, user_id, is_active) VALUES (?, ?, ?, ?)", 
                       ("Demo Key", "sk-demo", 1, 1))
        keys = [cursor.lastrowid]
    
    models = ["llama3", "mistral", "gemma:2b", "codellama"]
    
    # Generate entries over last 7 days
    now = datetime.now()
    for _ in range(200):
        # Random time in last 7 days
        days_ago = random.randint(0, 6)
        delta = timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        created_at = (now - delta).strftime("%Y-%m-%d %H:%M:%S")
        
        status_code = 200 if random.random() > 0.05 else 500
        latency = random.uniform(20, 1500)
        tokens_in = random.randint(50, 500)
        tokens_out = random.randint(50, 800)
        
        cursor.execute("""
            INSERT INTO request_logs (key_id, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status_code, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            random.choice(keys),
            random.choice(models),
            tokens_in,
            tokens_out,
            tokens_in + tokens_out,
            latency,
            status_code,
            "127.0.0.1",
            created_at
        ))
    
    conn.commit()
    conn.close()
    return {"status": "seeded"}

