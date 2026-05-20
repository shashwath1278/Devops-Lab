import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = (os.environ.get("SUPABASE_URL") or "").strip()
key: str = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or ""
).strip()

if not url or not key:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (check Azure env vars)."
    )

supabase: Client = create_client(url, key)
