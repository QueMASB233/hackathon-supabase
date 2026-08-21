from __future__ import annotations

import os
from typing import Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel

JAILBREAK = (
    "ignore previous instructions",
    "ignora las instrucciones",
    "jailbreak",
    "system prompt",
    "revela todos los clientes",
    "bypass",
    "developer mode",
)

CROSS_TENANT = (
    "maría s.a",
    "maria s.a",
    "workspace de maría",
    "workspace de maria",
    "otro cliente",
    "otros clientes",
    "otros workspaces",
    "otro workspace",
)

app = FastAPI(title="SecureWorkspace Guardrails")
_rails: Any = None


def _load_nemo() -> Any:
    global _rails
    if _rails is not None:
        return _rails
    try:
        from nemoguardrails import LLMRails, RailsConfig

        config_path = os.path.join(os.path.dirname(__file__))
        config = RailsConfig.from_path(config_path)
        _rails = LLMRails(config)
    except Exception:
        _rails = False
    return _rails


class CheckIn(BaseModel):
    stage: str
    message: str
    workspaceName: Optional[str] = None
    retrievedContext: Optional[str] = None


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/v1/check")
def check(body: CheckIn) -> dict[str, Any]:
    text = (body.message or "").lower()
    if body.stage == "input":
        if any(needle in text for needle in JAILBREAK):
            return {"allowed": False, "code": "PROMPT_BLOCKED"}
        if any(needle in text for needle in CROSS_TENANT):
            return {"allowed": False, "code": "OUT_OF_SCOPE"}
        if "arma" in text or "odio" in text:
            return {"allowed": False, "code": "AI_BLOCKED"}

    rails = _load_nemo()
    if rails:
        try:
            result = rails.generate(messages=[{"role": "user", "content": body.message}])
            content = ""
            if isinstance(result, dict):
                content = str(result.get("content") or result.get("last") or "")
            else:
                content = str(result)
            lowered = content.lower()
            if "fuera del alcance" in lowered:
                return {"allowed": False, "code": "OUT_OF_SCOPE"}
            if "no puede procesarse" in lowered:
                return {"allowed": False, "code": "PROMPT_BLOCKED"}
        except Exception:
            pass

    if body.stage == "output":
        leaked = ("service_role", "openai_api_key", "ignore previous")
        if any(token in (body.message or "").lower() for token in leaked):
            return {"allowed": False, "code": "AI_BLOCKED"}

    return {"allowed": True}
