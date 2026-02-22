from backend.database import get_db_connection
from backend.utils import encrypt_value, decrypt_value
import sqlite3

class ConfigService:
    def get(self, key: str) -> str | None:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM config WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["value"]
        return None

    def set(self, key: str, value: str, encrypted: bool = False):
        if encrypted:
            value = encrypt_value(value)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        conn.close()

    def get_setup_status(self) -> bool:
        return self.get("setup_complete") == "true"

    def mark_setup_complete(self):
        self.set("setup_complete", "true")

    def get_auth_config(self):
        provider = self.get("auth_provider") or "local"
        if provider == "oidc":
            return {
                "provider": "oidc",
                "issuer_url": self.get("oidc_issuer_url"),
                "client_id": self.get("oidc_client_id"),
                "client_secret": decrypt_value(self.get("oidc_client_secret")) if self.get("oidc_client_secret") else None
            }
        return {"provider": "local"}

    def set_auth_config(self, config: dict):
        provider = config.get("provider", "local")
        self.set("auth_provider", provider)
        if provider == "oidc":
            if "issuer_url" in config:
                self.set("oidc_issuer_url", config["issuer_url"])
            if "client_id" in config:
                self.set("oidc_client_id", config["client_id"])
            if "client_secret" in config:
                self.set("oidc_client_secret", config["client_secret"], encrypted=True)

    def get_infrastructure_config(self):
        return {
            "ollama_url": self.get("ollama_url"),
            "chroma_url": self.get("chroma_url")
        }

    def set_infrastructure_config(self, config: dict):
        if "ollama_url" in config:
            self.set("ollama_url", config["ollama_url"])
        if "chroma_url" in config:
            self.set("chroma_url", config["chroma_url"])

config_service = ConfigService()
