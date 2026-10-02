import os
import time
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis = None
_in_memory_store = {}
_in_memory_expirations = {}

try:
    import redis
    _client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    _client.ping()
    _redis = _client
    print(f"Connected to Redis at {REDIS_URL}")
except Exception as e:
    print(f"Redis not available ({e}). Using in-memory fallback store.")
    _redis = None


def set_otp(identifier: str, otp: str, ttl_seconds: int = 600) -> None:
    """Store OTP with TTL (default 10 minutes)"""
    if _redis:
        try:
            _redis.setex(f"otp:{identifier}", ttl_seconds, otp)
            return
        except Exception as e:
            print(f"Redis set_otp failed ({e}), using in-memory fallback.")

    _in_memory_store[identifier] = otp
    _in_memory_expirations[identifier] = time.time() + ttl_seconds


def get_otp(identifier: str) -> Optional[str]:
    """Get stored OTP if valid"""
    if _redis:
        try:
            val = _redis.get(f"otp:{identifier}")
            if val is not None:
                return str(val)
        except Exception as e:
            print(f"Redis get_otp failed ({e}), using in-memory fallback.")

    exp = _in_memory_expirations.get(identifier)
    if exp and time.time() > exp:
        delete_otp(identifier)
        return None
    return _in_memory_store.get(identifier)


def delete_otp(identifier: str) -> None:
    """Delete OTP entry"""
    if _redis:
        try:
            _redis.delete(f"otp:{identifier}")
        except Exception as e:
            print(f"Redis delete_otp failed ({e}).")

    _in_memory_store.pop(identifier, None)
    _in_memory_expirations.pop(identifier, None)
