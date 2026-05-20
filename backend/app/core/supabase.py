import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def _clean_env(name: str) -> str | None:
    value = os.environ.get(name)
    if value is None:
        return None
    value = value.strip()
    return value or None


url: str | None = _clean_env("SUPABASE_URL")
key: str | None = _clean_env("SUPABASE_SERVICE_ROLE_KEY") or _clean_env("SUPABASE_KEY")

if not url or not key:
    print(
        "WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — "
        "auth and database calls will fail."
    )
    supabase: Client | None = None
else:
    supabase: Client = create_client(url, key)
