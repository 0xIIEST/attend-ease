from backend.main import app as fastapi_app

# Vercel sends the full path (e.g., /api/auth/login) to this handler.
# FastAPI routes are defined without the /api prefix (e.g., /auth/login).
# This ASGI wrapper strips the /api prefix before passing to FastAPI.

async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        if path.startswith("/api"):
            scope["path"] = path[4:] or "/"  # Strip /api, default to / if empty
    await fastapi_app(scope, receive, send)
