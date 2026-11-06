"""The checks POST /query makes before retrieval (app/api/routes.py, lines 126-153 at commit eca020b).

Used by the portfolio's in-browser demo, which runs this file and the app/ modules beside it with Pyodide.
Retrieval and the answer step need the server's data and a model, so they are not run here.
"""

from app.routing.query_router import route_query
from app.security.guardrails import access_denied_message
from app.security.prompt_injection import detect_prompt_injection
from app.security.rbac import allowed_permissions


def check(role: str, query: str) -> dict:
    flags = detect_prompt_injection(query)
    if flags:
        return {
            "status": "security_violation",
            "flags": flags,
            "answer": "Security violation: prompt injection or jailbreak attempt detected.",
        }
    route = route_query(query)
    user_permissions = allowed_permissions(role)
    unauthorized = [p for p in route["required_permissions"] if p not in user_permissions]
    result = {
        "intent": route["intent"],
        "sources": route["source_types"],
        "required": route["required_permissions"],
        "authorized": [p for p in route["required_permissions"] if p in user_permissions],
        "unauthorized": unauthorized,
    }
    if len(unauthorized) == len(route["required_permissions"]):
        result.update(status="access_denied", answer=access_denied_message(unauthorized))
    else:
        result.update(status="retrieve")
    return result
