"""
cache.py
========
Shared TTL caches used across services.
Import these instances instead of creating new caches in each service.
"""
from cachetools import TTLCache

# 5-minute TTL, up to 10 distinct slice combinations
slice_cache: TTLCache = TTLCache(maxsize=10, ttl=300)

# 1-hour TTL for Argo float lists
argo_cache: TTLCache = TTLCache(maxsize=50, ttl=3600)
