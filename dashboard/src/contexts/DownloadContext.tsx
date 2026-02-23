import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface DownloadStatus {
  progress: number;
  status: string;
  total?: number;
  completed?: number;
  modelId: string;
  isPaused?: boolean;
}

interface DownloadContextType {
  downloads: { [key: string]: DownloadStatus };
  startDownload: (modelId: string) => void;
  stopDownload: (modelId: string) => void;
  pauseDownload: (modelId: string) => void;
  resumeDownload: (modelId: string) => void;
  activeDownloadCount: number;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
};

const WS_BASE = "ws://localhost:8000/api";

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [downloads, setDownloads] = useState<{ [key: string]: DownloadStatus }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const ws = new WebSocket(`${WS_BASE}/models/downloads`);
    wsRef.current = ws;

    ws.onopen = () => {
        console.log("Connected to global download manager");
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'status_update') {
                const newDownloads = data.downloads || {};
                
                // Compare with previous state to detect completions
                Object.values(newDownloads as { [key: string]: DownloadStatus }).forEach(dl => {
                    const prevStatus = downloads[dl.modelId]?.status;
                    if (dl.status === 'completed' && prevStatus !== 'completed') {
                        toast({
                            title: "Download Complete",
                            description: `${dl.modelId} is ready.`,
                        });
                        window.dispatchEvent(new Event('model-download-complete'));
                    }
                });

                setDownloads(newDownloads);
            }
        } catch (e) {
            console.error("WS Parse error", e);
        }
    };

    ws.onerror = (e) => {
        console.error("WebSocket error check console for details");
    };

    ws.onclose = () => {
        console.log("Download manager disconnected, reconnecting...");
        wsRef.current = null;
        if (!reconnectTimeoutRef.current) {
             reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
    };
  };

  useEffect(() => {
    connect();
    return () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    };
  }, []);

  const sendCommand = (action: string, modelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action, modelId }));
    } else {
        toast({ title: "Connection Lost", description: "Trying to reconnect...", variant: "destructive" });
        connect();
    }
  };

  const startDownload = (modelId: string) => sendCommand("start", modelId);
  const stopDownload = (modelId: string) => sendCommand("stop", modelId);
  const pauseDownload = (modelId: string) => sendCommand("pause", modelId);
  const resumeDownload = (modelId: string) => sendCommand("resume", modelId);

  return (
    <DownloadContext.Provider value={{ 
        downloads, 
        startDownload: (id) => sendCommand("start", id), 
        stopDownload: (id) => sendCommand("stop", id), 
        pauseDownload: (id) => sendCommand("pause", id), 
        resumeDownload: (id) => sendCommand("resume", id),
        activeDownloadCount: Object.keys(downloads).length 
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
